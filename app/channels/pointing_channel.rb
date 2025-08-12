class PointingChannel < ApplicationCable::Channel
  def subscribed
    Rails.logger.info "PointingChannel: User subscribed"
    stream_from "pointing_channel"
  end

  def unsubscribed
    Rails.logger.info "PointingChannel: User unsubscribed"
  end
end