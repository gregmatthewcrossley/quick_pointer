import { Controller } from "@hotwired/stimulus"
import { createConsumer } from "@rails/actioncable"

export default class extends Controller {
  connect() {
    console.log("Pointing controller connected")
    this.addEventListeners()
    this.setupPresenceChannel()
    
    // Re-attach listeners after Turbo Stream updates
    document.addEventListener('turbo:frame-load', () => {
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
            sessionFrame.innerHTML = data.html
            // Re-attach event listeners after content update
            this.addEventListeners()
          }
        }
      }
    })
  }

  addEventListeners() {
    // Jira URL input
    const jiraInput = document.querySelector('#jira_url')
    if (jiraInput) {
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
    }
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

    // Vote buttons
    document.querySelectorAll('.vote-button').forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault()
        const value = e.currentTarget.dataset.voteValue
        this.submitVote(value)
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
    const formData = new FormData()
    formData.append('value', value)
    
    fetch('/vote', {
      method: 'POST',
      headers: {
        'X-CSRF-Token': document.querySelector('[name="csrf-token"]').content,
        'Accept': 'text/vnd.turbo-stream.html'
      },
      body: formData
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