module Admin
  class ChoicesController < ApplicationController
    before_action :set_event

    # POST /api/v1/admin/events/:event_id/choices
    def create
      choice = @event.choices.new(choice_params)
      if choice.save
        render json: choice.as_json(include: :outcomes), status: :created
      else
        render json: { error: choice.errors.full_messages.join(", ") }, status: :unprocessable_entity
      end
    end

    # PATCH /api/v1/admin/events/:event_id/choices/:id
    def update
      choice = @event.choices.find(params[:id])
      if choice.update(choice_params)
        render json: choice.as_json(include: :outcomes)
      else
        render json: { error: choice.errors.full_messages.join(", ") }, status: :unprocessable_entity
      end
    rescue ActiveRecord::RecordNotFound
      render json: { error: "Choice not found" }, status: :not_found
    end

    # DELETE /api/v1/admin/events/:event_id/choices/:id
    def destroy
      choice = @event.choices.find(params[:id])
      choice.destroy
      render json: { message: "Choice deleted" }
    rescue ActiveRecord::RecordNotFound
      render json: { error: "Choice not found" }, status: :not_found
    end

    private

    def set_event
      @event = Event.find(params[:event_id])
    rescue ActiveRecord::RecordNotFound
      render json: { error: "Event not found" }, status: :not_found
    end

    def choice_params
      params.require(:choice).permit(:content_en, :content_vi, :i18n_key, display_conditions: {})
    end
  end
end
