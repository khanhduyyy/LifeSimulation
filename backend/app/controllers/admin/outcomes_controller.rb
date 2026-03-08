module Admin
  class OutcomesController < ApplicationController
    before_action :set_choice

    # POST /api/v1/admin/events/:event_id/choices/:choice_id/outcomes
    def create
      outcome = @choice.outcomes.new(outcome_params)
      if outcome.save
        render json: outcome, status: :created
      else
        render json: { error: outcome.errors.full_messages.join(", ") }, status: :unprocessable_entity
      end
    end

    # PATCH /api/v1/admin/events/:event_id/choices/:choice_id/outcomes/:id
    def update
      outcome = @choice.outcomes.find(params[:id])
      if outcome.update(outcome_params)
        render json: outcome
      else
        render json: { error: outcome.errors.full_messages.join(", ") }, status: :unprocessable_entity
      end
    rescue ActiveRecord::RecordNotFound
      render json: { error: "Outcome not found" }, status: :not_found
    end

    # DELETE /api/v1/admin/events/:event_id/choices/:choice_id/outcomes/:id
    def destroy
      outcome = @choice.outcomes.find(params[:id])
      outcome.destroy
      render json: { message: "Outcome deleted" }
    rescue ActiveRecord::RecordNotFound
      render json: { error: "Outcome not found" }, status: :not_found
    end

    private

    def set_choice
      @choice = Choice.find(params[:choice_id])
    rescue ActiveRecord::RecordNotFound
      render json: { error: "Choice not found" }, status: :not_found
    end

    def outcome_params
      params.require(:outcome).permit(:message_en, :message_vi, :probability, :i18n_key, :next_event_id, stat_changes: {}, set_flags: {})
    end
  end
end
