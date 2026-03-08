module Admin
  class EventsController < ApplicationController
    # GET /api/v1/admin/events
    def index
      events = Event.order(:id).includes(choices: :outcomes)
      render json: events.as_json(include: {
        choices: { include: :outcomes }
      })
    end

    # GET /api/v1/admin/events/:id
    def show
      event = Event.find(params[:id])
      render json: event.as_json(include: {
        choices: { include: :outcomes }
      })
    rescue ActiveRecord::RecordNotFound
      render json: { error: "Event not found" }, status: :not_found
    end

    # POST /api/v1/admin/events
    def create
      event = Event.new(event_params)
      if event.save
        render json: event.as_json(include: {
          choices: { include: :outcomes }
        }), status: :created
      else
        render json: { error: event.errors.full_messages.join(", ") }, status: :unprocessable_entity
      end
    end

    # PATCH /api/v1/admin/events/:id
    def update
      event = Event.find(params[:id])
      if event.update(event_params)
        render json: event.as_json(include: {
          choices: { include: :outcomes }
        })
      else
        render json: { error: event.errors.full_messages.join(", ") }, status: :unprocessable_entity
      end
    rescue ActiveRecord::RecordNotFound
      render json: { error: "Event not found" }, status: :not_found
    end

    # DELETE /api/v1/admin/events/:id
    def destroy
      event = Event.find(params[:id])
      event.destroy
      render json: { message: "Event deleted" }
    rescue ActiveRecord::RecordNotFound
      render json: { error: "Event not found" }, status: :not_found
    end

    private

    def event_params
      params.require(:event).permit(:title_en, :title_vi, :description_en, :description_vi, :i18n_key, conditions: {})
    end
  end
end
