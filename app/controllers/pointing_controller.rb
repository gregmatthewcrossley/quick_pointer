class PointingController < ApplicationController
  def index
    @session_data = get_session_data
    @user_id = ensure_user_id
    @user_vote = @session_data[:votes][@user_id]
    @presence_count = Rails.cache.read("presence_count") || 0
  end

  def update_url
    session_data = get_session_data
    session_data[:jira_url] = params[:jira_url]
    save_session_data(session_data)
    broadcast_update
  end

  def vote
    session_data = get_session_data
    session_data[:votes] ||= {}
    session_data[:votes][ensure_user_id] = params[:value].to_i
    save_session_data(session_data)
    broadcast_update
  end

  def reveal
    session_data = get_session_data
    session_data[:revealed] = true
    save_session_data(session_data)
    broadcast_update
  end

  def clear
    save_session_data(default_session_data)
    broadcast_update
  end

  def highlight
    session_data = get_session_data
    session_data[:highlighted_card] = params[:value].to_i
    save_session_data(session_data)
    broadcast_update
  end

  private

  def ensure_user_id
    session[:user_id] ||= SecureRandom.uuid
  end

  def get_session_data
    Rails.cache.fetch("pointing_session", expires_in: 24.hours) do
      default_session_data
    end
  end

  def save_session_data(data)
    Rails.cache.write("pointing_session", data, expires_in: 24.hours)
  end

  def default_session_data
    {
      jira_url: "",
      votes: {},
      revealed: false,
      highlighted_card: nil
    }
  end

  def broadcast_update
    session_data = get_session_data
    user_vote = session_data[:votes][ensure_user_id]
    
    # Broadcast via ActionCable to all connected users
    ActionCable.server.broadcast("pointing_channel", {
      type: "session_update",
      html: render_to_string(partial: "pointing/session", formats: [:html], locals: { session_data: session_data, user_vote: user_vote })
    })
    
    respond_to do |format|
      format.turbo_stream { render turbo_stream: turbo_stream.replace("pointing_session", partial: "pointing/session", locals: { session_data: session_data, user_vote: user_vote }) }
      format.html { redirect_to root_path }
    end
  end
end