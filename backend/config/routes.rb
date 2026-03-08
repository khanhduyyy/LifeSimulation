Rails.application.routes.draw do
  # API namespace
  namespace :api do
    namespace :v1 do
      resources :characters, only: [:create, :show, :update]
      resources :events, only: [:index, :show]
      resources :choices, only: [:show] do
        member do
          post :select  # Player selects a choice → roll dice for outcome
        end
      end
    end
  end

  # Admin API
  namespace :admin do
    resources :events do
      resources :choices, only: [:create, :update, :destroy] do
        resources :outcomes, only: [:create, :update, :destroy]
      end
    end
  end

  # Health check
  get "up" => "rails/health#show", as: :rails_health_check

  # API root info
  get "/api/health", to: proc { [200, { "Content-Type" => "application/json" }, ['{"status":"ok","app":"LifeSimulation API"}']] }
end
