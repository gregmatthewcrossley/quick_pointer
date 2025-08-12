import { Controller } from "@hotwired/stimulus"
import { createConsumer } from "@rails/actioncable"

export default class extends Controller {
  connect() {
    console.log("Pointing controller connected")
    console.log("Controller element:", this.element)
    this.addEventListeners()
    this.setupPresenceChannel()
    
    // Re-attach listeners after Turbo Stream updates
    document.addEventListener('turbo:frame-load', () => {
      console.log("Turbo frame loaded, re-attaching listeners")
      this.addEventListeners()
    })
  }

  setupPresenceChannel() {
    console.log("Setting up channels...")
    this.consumer = createConsumer()
    
    // Presence channel for user count
    this.presenceChannel = this.consumer.subscriptions.create("PresenceChannel", {
      connected() {
        console.log("Connected to presence channel")
      },

      disconnected() {
        console.log("Disconnected from presence channel")
      },

      received(data) {
        console.log("Received presence data:", data)
        if (data.type === "presence_update") {
          const presenceElement = document.getElementById("presence-count")
          if (presenceElement) {
            const text = data.count === 1 ? "1 person here" : `${data.count} people here`
            console.log("Updating presence to:", text)
            presenceElement.textContent = text
          } else {
            console.log("Presence element not found")
          }
        }
      }
    })

    // Pointing channel for session updates
    this.pointingChannel = this.consumer.subscriptions.create("PointingChannel", {
      connected() {
        console.log("Connected to pointing channel")
      },

      disconnected() {
        console.log("Disconnected from pointing channel")
      },

      received: (data) => {
        console.log("Received pointing data:", data)
        if (data.type === "session_update") {
          const sessionFrame = document.getElementById("pointing_session")
          if (sessionFrame) {
            // Store current vote selection before update
            const currentSelection = this.getCurrentVoteSelection()
            
            // Check if this is a clear operation by looking for votes in the new HTML
            const tempDiv = document.createElement('div')
            tempDiv.innerHTML = data.html
            const hasVotes = tempDiv.querySelector('.vote-card') !== null || 
                           tempDiv.innerHTML.includes('face-down') ||
                           tempDiv.innerHTML.includes('card-pattern')
            
            sessionFrame.innerHTML = data.html
            
            // Re-attach event listeners first
            this.addEventListeners()
            
            // Only restore selection if this wasn't a clear operation
            if (!hasVotes) {
              // This was a clear - don't restore any selection
              console.log("Clear detected, not restoring vote selection")
              this.clearLocalVoteSelection()
            } else {
              // Normal update - restore local vote selection (with delay to ensure DOM is ready)
              setTimeout(() => {
                if (currentSelection) {
                  this.updateLocalVoteSelection(currentSelection)
                }
              }, 10)
            }
          }
        }
      }
    })
  }

  addEventListeners() {
    console.log("Adding event listeners...")
    
    // Jira URL input
    const jiraInput = document.querySelector('#jira_url')
    console.log("Jira input found:", jiraInput)
    if (jiraInput) {
      console.log("Setting up jira input listeners")
      let timeout
      
      jiraInput.addEventListener('input', (e) => {
        // Update button immediately
        this.updateLinkButton(e.target.value)
        
        // Debounce server update
        clearTimeout(timeout)
        timeout = setTimeout(() => {
          this.updateUrl(e.target.value)
        }, 1500)
      })

      jiraInput.addEventListener('blur', (e) => {
        // Save immediately when user unfocuses the field
        clearTimeout(timeout)
        this.updateUrl(e.target.value)
      })

      jiraInput.addEventListener('keydown', (e) => {
        // Save immediately when user presses Enter
        if (e.key === 'Enter') {
          clearTimeout(timeout)
          this.updateUrl(e.target.value)
          e.target.blur() // Remove focus from the input
        }
      })
    }
    
    console.log("About to look for vote buttons...")

    // Vote buttons
    const voteButtons = document.querySelectorAll('.vote-button')
    console.log(`Found ${voteButtons.length} vote buttons`)
    console.log('Vote buttons:', voteButtons)
    
    if (voteButtons.length === 0) {
      console.log('No vote buttons found, checking for buttons with data-vote-value...')
      const dataButtons = document.querySelectorAll('[data-vote-value]')
      console.log(`Found ${dataButtons.length} buttons with data-vote-value:`, dataButtons)
    }
    
    voteButtons.forEach(button => {
      // Remove existing listeners to avoid duplicates
      button.replaceWith(button.cloneNode(true))
    })
    
    // Re-select after cloning to get fresh references
    document.querySelectorAll('.vote-button').forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault()
        console.log('Vote button clicked:', e.currentTarget.dataset.voteValue)
        const value = e.currentTarget.dataset.voteValue
        const currentSelection = this.getCurrentVoteSelection()
        
        if (currentSelection === value) {
          // Clicking the same button - unselect it
          console.log('Unselecting vote:', value)
          this.clearLocalVoteSelection()
          this.removeVote()
        } else {
          // Clicking a different button - select it
          console.log('Selecting vote:', value)
          this.updateLocalVoteSelection(value)
          this.submitVote(value)
        }
      })
    })

    // Reveal button
    const revealButton = document.querySelector('.reveal-button')
    if (revealButton) {
      revealButton.addEventListener('click', (e) => {
        e.preventDefault()
        this.revealVotes()
      })
    }

    // Clear button
    const clearButton = document.querySelector('.clear-button')
    if (clearButton) {
      clearButton.addEventListener('click', (e) => {
        e.preventDefault()
        this.clearSession()
      })
    }

    // Vote cards for highlighting
    document.querySelectorAll('.vote-card').forEach(card => {
      card.addEventListener('click', (e) => {
        e.preventDefault()
        const value = e.currentTarget.dataset.highlightValue
        this.highlightCard(value)
      })
    })
  }

  updateLinkButton(url) {
    const linkButton = document.querySelector('a[target="_blank"]')
    if (linkButton) {
      let urlWithProtocol = url
      if (url && !url.match(/^https?:\/\//i)) {
        urlWithProtocol = `https://${url}`
      }
      
      linkButton.href = urlWithProtocol || '#'
      
      if (url && url.trim() !== '') {
        linkButton.classList.remove('pointer-events-none', 'opacity-50')
      } else {
        linkButton.classList.add('pointer-events-none', 'opacity-50')
      }
    }
  }

  getCurrentVoteSelection() {
    const selectedButton = document.querySelector('.vote-button.bg-blue-500')
    return selectedButton ? selectedButton.dataset.voteValue : null
  }

  updateLocalVoteSelection(selectedValue) {
    // Remove selection from all vote buttons
    document.querySelectorAll('.vote-button').forEach(button => {
      button.classList.remove('bg-blue-500', 'text-white', 'border-blue-600')
      button.classList.add('bg-white', 'text-gray-700', 'border-gray-300')
    })
    
    // Add selection to the clicked button
    const selectedButton = document.querySelector(`[data-vote-value="${selectedValue}"]`)
    if (selectedButton) {
      selectedButton.classList.remove('bg-white', 'text-gray-700', 'border-gray-300')
      selectedButton.classList.add('bg-blue-500', 'text-white', 'border-blue-600')
    }
  }

  clearLocalVoteSelection() {
    // Remove selection from all vote buttons
    document.querySelectorAll('.vote-button').forEach(button => {
      button.classList.remove('bg-blue-500', 'text-white', 'border-blue-600')
      button.classList.add('bg-white', 'text-gray-700', 'border-gray-300')
    })
  }

  updateUrl(url) {
    const formData = new FormData()
    formData.append('jira_url', url)
    
    fetch('/update_url', {
      method: 'POST',
      headers: {
        'X-CSRF-Token': document.querySelector('[name="csrf-token"]').content,
        'Accept': 'text/vnd.turbo-stream.html'
      },
      body: formData
    })
  }

  submitVote(value) {
    console.log('Submitting vote:', value)
    const formData = new FormData()
    formData.append('value', value)
    
    fetch('/vote', {
      method: 'POST',
      headers: {
        'X-CSRF-Token': document.querySelector('[name="csrf-token"]').content,
        'Accept': 'text/vnd.turbo-stream.html'
      },
      body: formData
    }).then(response => {
      console.log('Vote response:', response.status)
      return response.text()
    }).then(text => {
      console.log('Vote response text:', text)
    }).catch(error => {
      console.error('Vote error:', error)
    })
  }

  removeVote() {
    console.log('Removing vote')
    fetch('/remove_vote', {
      method: 'POST',
      headers: {
        'X-CSRF-Token': document.querySelector('[name="csrf-token"]').content,
        'Accept': 'text/vnd.turbo-stream.html'
      }
    }).then(response => {
      console.log('Remove vote response:', response.status)
      return response.text()
    }).then(text => {
      console.log('Remove vote response text:', text)
    }).catch(error => {
      console.error('Remove vote error:', error)
    })
  }

  revealVotes() {
    fetch('/reveal', {
      method: 'POST',
      headers: {
        'X-CSRF-Token': document.querySelector('[name="csrf-token"]').content,
        'Accept': 'text/vnd.turbo-stream.html'
      }
    })
  }

  clearSession() {
    // Clear local vote selection immediately
    this.clearLocalVoteSelection()
    
    fetch('/clear', {
      method: 'POST',
      headers: {
        'X-CSRF-Token': document.querySelector('[name="csrf-token"]').content,
        'Accept': 'text/vnd.turbo-stream.html'
      }
    })
  }

  highlightCard(value) {
    const formData = new FormData()
    formData.append('value', value)
    
    fetch('/highlight', {
      method: 'POST',
      headers: {
        'X-CSRF-Token': document.querySelector('[name="csrf-token"]').content,
        'Accept': 'text/vnd.turbo-stream.html'
      },
      body: formData
    })
  }

  disconnect() {
    console.log("Pointing controller disconnecting")
    if (this.presenceChannel) {
      this.presenceChannel.unsubscribe()
    }
    if (this.pointingChannel) {
      this.pointingChannel.unsubscribe()
    }
    if (this.consumer) {
      this.consumer.disconnect()
    }
  }
}