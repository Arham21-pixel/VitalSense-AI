def combine_predictions(lstm_score, xgboost_score):
    return (lstm_score + xgboost_score) / 2
