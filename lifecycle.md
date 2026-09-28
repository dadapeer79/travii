# TRAVII Lifecycle

The application clearly shows the following steps in the agent's lifecycle:

1. **INPUT**: The user provides a travel request.
2. **UNDERSTAND**: The agent parses the request to identify origin, destination, days, budget, and interests.
3. **PLAN**: The agent creates an initial plan structure.
4. **ACT**: The agent uses travel tools to search for transport, hotels, and places.
5. **OBSERVE**: The agent calculates the total budget based on the findings.
6. **CHECK**: The agent verifies if the calculated budget is within the user's limit.
7. **RE-PLAN**: If the budget is exceeded, the agent adjusts its choices (e.g., selects cheaper options) and checks again.
8. **FINAL RESULT**: A final itinerary is generated and presented for human approval.
