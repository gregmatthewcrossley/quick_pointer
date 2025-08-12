class PresenceChannel < ApplicationCable::Channel
  def subscribed
    Rails.logger.info "PresenceChannel: User subscribed"
    stream_from "presence_channel"
    
    # Track user joining
    update_presence_count(1)
  end

  def unsubscribed
    Rails.logger.info "PresenceChannel: User unsubscribed"
    # Track user leaving
    update_presence_count(-1)
  end

  private

  def update_presence_count(delta)
    count = Rails.cache.read("presence_count") || 0
    count = [count + delta, 0].max
    Rails.cache.write("presence_count", count, expires_in: 24.hours)
    
    Rails.logger.info "PresenceChannel: Updated count to #{count}"
    
    ActionCable.server.broadcast("presence_channel", {
      type: "presence_update",
      count: count
    })
  end
end