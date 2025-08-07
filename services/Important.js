import { MongoClient } from 'mongodb';
import axios from 'axios'
import dotenv from 'dotenv';
import { ObjectId } from 'mongodb';

dotenv.config()

class CustomerBot {
    constructor(model = "meta-llama/llama-4-scout-17b-16e-instruct") {
        this.model = model;
        this.groqApiKey = process.env.GROQ_API_KEY;
        this.mongoUrl = process.env.MONGO_URL || "mongodb://localhost:27017/";
        this.dbName = "foodDelivery";
        this.client = null;
        this.db = null;

        if (!this.groqApiKey) {
            throw new Error("GROQ_API_KEY not found in environment variables");
        }

        // MongoDB query generation prompt
        this.prompt = `
You are a MongoDB expert assistant. Given a plain-language request and a collection schema, generate a single, syntactically valid MongoDB query object in JSON. Do not return any explanation, commentary, or extra fields—only the JSON query document.

### Inputs
- **Natural Language Query**: {query}
- **Collection Schema**: {schema}

### Rules
1. **Field Usage**  
   - Only reference fields defined in the provided schema.  
   - Don't invent or alias new fields.

2. **Data Types**  
   - Match schema types exactly:  
     - String → quoted JSON strings  
     - Number → unquoted numerals  
     - Boolean → \`true\` / \`false\`

3. **Text Matching**  
   - For any substring or keyword search on string fields, use a case-insensitive regex:  
     \`\`\`json
     { "fieldName": { "$regex": "searchTerm", "$options": "i" } }
     \`\`\`

4. **Numeric Comparison**  
   - Use comparison operators \`$lt\`, \`$lte\`, \`$gt\`, \`$gte\`, \`$eq\`, \`$ne\` as needed.

5. **Boolean Filters**  
   - Represent boolean conditions directly: \`{ "available": true }\` or \`{ "available": false }\`.

6. **Location Filtering**  
   - For city-based queries, use case-insensitive regex on city field: \`{ "city": { "$regex": "cityName", "$options": "i" } }\`

7. **Output**  
   - Return **only** the JSON object for the query

### Examples
- **NL**: "Find available burgers under $8"  
  \`\`\`json
  {
    "itemName": { "$regex": "burger", "$options": "i" },
    "price": { "$lt": "8" },
    "available": true
  }
  \`\`\`
`;

        // UPDATED Response generation prompt
        this.responsePrompt = `
You are a friendly customer support agent for a food delivery service. Answer the customer's query based on the provided data.

### Customer Query:
{query}

### Available Data:
{content}

### Instructions:
- Be friendly, helpful, and engaging
- If data is available, provide specific details (restaurant names, item names, prices, descriptions, ratings, availability, addresses, cities)
- Format prices clearly with currency symbols when possible
- Mention availability status and city/location when relevant
- If multiple restaurants match, list them clearly with their cities
- Group results by restaurants when suggesting restaurants for items
- If no data matches, politely explain and suggest alternatives
- Keep responses concise but informative

### For restaurant items queries:
- Show the complete menu/items from the restaurant
- Include item names, descriptions, prices, availability status
- Group items by categories if possible
- Show restaurant details (name, address, phone, hours, city)
- Format the response as a clear menu list

### For restaurant suggestions:
- Show restaurants that serve the requested item
- Include restaurant name, city, address, contact info
- Show the specific items they offer with prices
- Mention operating hours when available

### For general searches:
- Show relevant items or restaurants based on the search
- Provide complete details for each result
- Group by restaurants when showing items

- If the data is empty or None, say "I'm sorry, I couldn't find information about that in our system."

Response:
`;
    }

    async connectToMongoDB() {
        try {
            this.client = new MongoClient(this.mongoUrl, {
                serverSelectionTimeoutMS: 5000
            });
            await this.client.connect();
            await this.client.db("admin").command({ ping: 1 });
            this.db = this.client.db(this.dbName);
            console.log("Successfully connected to MongoDB");
            return true;
        } catch (error) {
            console.error("Failed to connect to MongoDB:", error.message);
            throw error;
        }
    }

    async callGroqAPI(prompt) {
        try {
            const response = await axios.post(
                'https://api.groq.com/openai/v1/chat/completions',
                {
                    model: this.model,
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.1
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.groqApiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            return response.data.choices[0].message.content;
        } catch (error) {
            console.error("Error calling Groq API:", error.message);
            throw error;
        }
    }

    // REPLACE your existing classifyQuery method with this ENHANCED version
    async classifyQuery(userQuery) {
        const classificationPrompt = `
You are an expert at classifying user queries for a restaurant database.
Analyze the user query and extract:
1. Query type: "restaurant_suggestion", "general_search", "order_inquiry", "review_search", "restaurant_info", or "restaurant_items"
2. Item name (if mentioned)
3. Restaurant name (if mentioned)
4. City name (if mentioned)
5. Primary collection to search

Pakistani cities to look for: Karachi, Lahore, Islamabad, Peshawar

Guidelines:
- "restaurant_suggestion" when user asks for restaurants that serve specific items
- "restaurant_items" when user asks for items/menu from a specific restaurant
- "restaurant_info" when user asks about restaurant details
- "general_search" for searching items, prices, availability across all restaurants
- Extract city names from the query (case-insensitive)
- Extract item names and restaurant names mentioned in the query

Format your response as JSON:
{
  "queryType": "restaurant_items",
  "itemName": "extracted item name or null",
  "restaurantName": "extracted restaurant name or null",
  "cityName": "extracted city name or null",
  "primaryCollection": "items"
}

User Query: ${userQuery}
Classification:
`;

        try {
            const output = await this.callGroqAPI(classificationPrompt);
            let cleanOutput = output.trim();

            if (cleanOutput.includes('```')) {
                const parts = cleanOutput.split('```');
                cleanOutput = parts[1];
                if (cleanOutput.startsWith('json')) {
                    cleanOutput = cleanOutput.substring(4);
                }
            }

            const classification = JSON.parse(cleanOutput);
            console.log(`Query classification:`, classification);
            return classification;
        } catch (error) {
            console.error("Error parsing classification:", error);
            return {
                queryType: "general_search",
                itemName: null,
                restaurantName: userQuery,
                cityName: null,
                primaryCollection: "items"
            };
        }
    }

    async executeQuery(collectionName, query, limit = 50) {
        try {
            const collection = this.db.collection(collectionName);
            const results = await collection.find(query).limit(limit).toArray();

            // Convert ObjectId to string for JSON serialization
            results.forEach(result => {
                if (result._id) {
                    result._id = result._id.toString();
                }
                // Convert other ObjectIds to strings
                Object.keys(result).forEach(key => {
                    if (result[key] && typeof result[key] === 'object' && result[key].constructor.name === 'ObjectId') {
                        result[key] = result[key].toString();
                    }
                });
            });

            console.log(`Found ${results.length} documents in ${collectionName}`);
            return results;

        } catch (error) {
            console.error("Error executing query:", error.message);
            return [];
        }
    }

    // ADD this NEW method after executeQuery method
    async getRestaurantItems(restaurantName, cityName = null) {
        try {
            console.log(`Searching for items from restaurant: "${restaurantName}" in city: ${cityName || 'all cities'}`);

            // Step 1: Find the restaurant by name
            let restaurantQuery = {
                name: { "$regex": restaurantName, "$options": "i" }
            };

            if (cityName) {
                restaurantQuery.city = { "$regex": cityName, "$options": "i" };
            }

            const restaurants = await this.executeQuery("restaurants", restaurantQuery, 10);

            if (restaurants.length === 0) {
                const cityMessage = cityName ? ` in ${cityName}` : '';
                return {
                    restaurants: [],
                    items: [],
                    message: `Sorry, I couldn't find any restaurant named "${restaurantName}"${cityMessage}.`
                };
            }

            // Step 2: Get all items for these restaurants
            const restaurantIds = restaurants.map(r => new ObjectId(r._id));
            const itemsQuery = {
                restaurantId: { "$in": restaurantIds }
            };

            const items = await this.executeQuery("items", itemsQuery, 200);

            // Step 3: Group items by restaurant
            const restaurantItemMap = {};
            items.forEach(item => {
                const restId = item.restaurantId.toString();
                if (!restaurantItemMap[restId]) {
                    restaurantItemMap[restId] = [];
                }
                restaurantItemMap[restId].push(item);
            });

            // Step 4: Combine restaurant and item data
            const combinedData = restaurants.map(restaurant => ({
                restaurant: restaurant,
                items: restaurantItemMap[restaurant._id.toString()] || []
            }));

            return {
                restaurants: restaurants,
                items: items,
                combinedData: combinedData,
                totalItems: items.length,
                message: `Found ${items.length} items from ${restaurants.length} restaurant(s) named "${restaurantName}"`
            };

        } catch (error) {
            console.error("Error in getRestaurantItems:", error.message);
            return {
                restaurants: [],
                items: [],
                message: "I encountered an error while searching for restaurant items."
            };
        }
    }

    // Enhanced method for city-based restaurant suggestions (KEEP this existing method)
    async suggestRestaurantsWithItem(itemName, cityName = null) {
        try {
            console.log(`Searching for "${itemName}" in city: ${cityName || 'all cities'}`);

            // Step 1: Find items matching the search term
            const itemQuery = {
                itemName: { "$regex": itemName, "$options": "i" },
                available: true
            };

            const matchingItems = await this.executeQuery("items", itemQuery, 100);

            if (matchingItems.length === 0) {
                return {
                    items: [],
                    restaurants: [],
                    message: `Sorry, I couldn't find any available "${itemName}" in our system.`
                };
            }

            // Step 2: Get unique restaurant IDs from matching items
            const restaurantIds = [...new Set(matchingItems.map(item => item.restaurantId))];

            // Step 3: Build restaurant query with city filter if provided
            let restaurantQuery = {};

            if (cityName) {
                restaurantQuery.city = { "$regex": cityName, "$options": "i" };
            }

            // Get all restaurants first, then filter by IDs and city
            const allRestaurants = await this.executeQuery("restaurants", restaurantQuery, 200);

            // Filter restaurants that match our restaurant IDs
            const matchingRestaurants = allRestaurants.filter(restaurant =>
                restaurantIds.includes(restaurant._id.toString())
            );

            if (matchingRestaurants.length === 0) {
                const cityMessage = cityName ? ` in ${cityName}` : '';
                return {
                    items: matchingItems,
                    restaurants: [],
                    message: `Found "${itemName}" in our system, but no restaurants${cityMessage} currently serve it.`
                };
            }

            // Step 4: Create restaurant-item mapping
            const restaurantItemMap = {};
            matchingItems.forEach(item => {
                const restId = item.restaurantId.toString();
                if (!restaurantItemMap[restId]) {
                    restaurantItemMap[restId] = [];
                }
                // Only add items from restaurants that match our city filter
                const restaurantExists = matchingRestaurants.find(r => r._id.toString() === restId);
                if (restaurantExists) {
                    restaurantItemMap[restId].push(item);
                }
            });

            // Step 5: Combine restaurant and item data
            const combinedData = matchingRestaurants.map(restaurant => ({
                restaurant: restaurant,
                items: restaurantItemMap[restaurant._id.toString()] || []
            })).filter(combo => combo.items.length > 0); // Only include restaurants that have the item

            const cityMessage = cityName ? ` in ${cityName}` : '';
            return {
                items: matchingItems,
                restaurants: matchingRestaurants,
                combinedData: combinedData,
                searchCity: cityName,
                message: `Found ${combinedData.length} restaurants serving "${itemName}"${cityMessage}`
            };

        } catch (error) {
            console.error("Error in suggestRestaurantsWithItem:", error.message);
            return {
                items: [],
                restaurants: [],
                message: "I encountered an error while searching for restaurants."
            };
        }
    }

    // REPLACE your existing generateResponse method with this ENHANCED version
    async generateResponse(userQuery) {
        try {
            // Step 1: Classify the query and extract city/item/restaurant info
            const classification = await this.classifyQuery(userQuery);

            let responseContent = "";

            // Step 2: Handle different query types
            if (classification.queryType === "restaurant_items" && classification.restaurantName) {
                // Special handling for getting items from a specific restaurant
                const restaurantResult = await this.getRestaurantItems(
                    classification.restaurantName,
                    classification.cityName
                );

                responseContent = {
                    queryType: "restaurant_items",
                    searchRestaurant: classification.restaurantName,
                    searchCity: classification.cityName,
                    restaurantData: restaurantResult.combinedData,
                    totalItems: restaurantResult.totalItems,
                    message: restaurantResult.message
                };

            } else if (classification.queryType === "restaurant_suggestion" && classification.itemName) {
                // Special handling for restaurant suggestions with city filtering
                const suggestionResult = await this.suggestRestaurantsWithItem(
                    classification.itemName,
                    classification.cityName
                );

                if (suggestionResult.combinedData && suggestionResult.combinedData.length > 0) {
                    responseContent = {
                        queryType: "restaurant_suggestion",
                        searchTerm: classification.itemName,
                        searchCity: classification.cityName,
                        restaurants: suggestionResult.combinedData,
                        totalFound: suggestionResult.combinedData.length,
                        message: suggestionResult.message
                    };
                } else {
                    responseContent = suggestionResult.message;
                }

            } else {
                // Handle other query types with enhanced city filtering
                const schema = collectionSchemas[classification.primaryCollection];

                // Build query with city filter if detected
                let baseQuery = {};
                if (classification.cityName && classification.primaryCollection === "restaurants") {
                    baseQuery.city = { "$regex": classification.cityName, "$options": "i" };
                }

                // Add item search if specified
                if (classification.itemName && classification.primaryCollection === "items") {
                    baseQuery.itemName = { "$regex": classification.itemName, "$options": "i" };
                    baseQuery.available = true;
                }

                // Add restaurant search if specified
                if (classification.restaurantName && classification.primaryCollection === "restaurants") {
                    baseQuery.name = { "$regex": classification.restaurantName, "$options": "i" };
                }

                const results = await this.executeQuery(classification.primaryCollection, baseQuery);

                responseContent = {
                    queryType: classification.queryType,
                    collection: classification.primaryCollection,
                    searchCity: classification.cityName,
                    searchItem: classification.itemName,
                    searchRestaurant: classification.restaurantName,
                    results: results,
                    totalFound: results.length
                };
            }

            // Step 3: Generate natural language response
            const promptFormatted = this.responsePrompt
                .replace('{query}', userQuery)
                .replace('{content}', JSON.stringify(responseContent, null, 2));

            const output = await this.callGroqAPI(promptFormatted);
            return output;

        } catch (error) {
            console.error("Error generating response:", error.message);
            return "I'm sorry, I encountered an error while processing your request. Please try again.";
        }
    }

    async close() {
        if (this.client) {
            await this.client.close();
            console.log("MongoDB connection closed");
        }
    }
}

// Keep your existing schema definitions (no changes needed)
const collectionSchemas = {
    "items": {
        "itemName": "str - name of the food item",
        "description": "str - description of the item",
        "price": "str - price of the item",
        "image": "str - URL to item image",
        "averageRating": "number - average rating of the item (0-5)",
        "available": "bool - whether the item is available or not",
        "category": "ObjectId - reference to category",
        "restaurantId": "ObjectId - reference to restaurant"
    },
    "categories": {
        "name": "str - name of the category",
        "slug": "str - URL-friendly slug of the category",
        "restaurantId": "ObjectId - reference to restaurant"
    },
    "orders": {
        "userId": "ObjectId - reference to user",
        "items": "array - list of items with item reference, name, image, quantity, price",
        "totalAmount": "number - total amount of the order",
        "shippingAddress": "object - delivery address details including city",
        "paymentMethod": "str - payment method (default: cash)",
        "restaurantId": "ObjectId - reference to restaurant",
        "status": "str - order status (Pending, Accepted, Preparing, Delivered, etc.)",
        "acceptStatus": "str - acceptance status",
        "createdAt": "date - order creation date"
    },
    "restaurants": {
        "name": "str - name of the restaurant",
        "description": "str - description of the restaurant",
        "image": "str - URL to restaurant image",
        "openingTime": "str - opening time",
        "closingTime": "str - closing time",
        "cuisines": "array - list of cuisine types",
        "address": "str - physical address",
        "phoneno": "str - phone number",
        "city": "str - city where restaurant is located",
        "status": "str - restaurant status (default: Pending)",
        "averageRestaurantRating": "number - average rating (default: 0)"
    },
    "reviews": {
        "user": "ObjectId - reference to user",
        "order": "ObjectId - reference to order",
        "restaurant": "ObjectId - reference to restaurant",
        "itemReviews": "array - reviews for individual items with ratings",
        "restaurantRating": "number - rating for restaurant (1-5)",
        "restaurantReviewText": "str - review text",
        "createdAt": "date - review creation date"
    }
};

// Keep your existing mongodbRAG function (no changes needed)
export async function mongodbRAG(userQuery, userCity = null) {
    const bot = new CustomerBot();

    try {
        // Connect to MongoDB
        await bot.connectToMongoDB();

        // If userCity is provided, append it to the query for better context
        const enhancedQuery = userCity ? `${userQuery} in ${userCity}` : userQuery;

        // Process user query and generate response
        const generatedResponse = await bot.generateResponse(enhancedQuery);

        // Close connection
        await bot.close();

        return generatedResponse;

    } catch (error) {
        console.error("Error in mongodbRAG:", error.message);
        await bot.close();
        return "I'm sorry, I encountered an error while processing your request. Please try again.";
    }
}

// Keep your existing examples function (no changes needed)
async function examples() {
    try {
        console.log("=== Example 1: Restaurant Items Query ===");
        const response1 = await mongodbRAG("Show me items from Chief Burger");
        console.log("Bot Response:", response1);

        console.log("\n=== Example 2: Restaurant Suggestion with City ===");
        const response2 = await mongodbRAG("Suggest me restaurants with Zinger Burger in Peshawar");
        console.log("Bot Response:", response2);

        console.log("\n=== Example 3: General Item Search with City ===");
        const response3 = await mongodbRAG("What restaurants serve pizza in Lahore?");
        console.log("Bot Response:", response3);

        console.log("\n=== Example 4: Using userCity parameter ===");
        const response4 = await mongodbRAG("Which restaurants have biryani?", "Karachi");
        console.log("Bot Response:", response4);

    } catch (error) {
        console.error("Error:", error.message);
    }
}

// Export for use in other modules
export default {
    CustomerBot,
    mongodbRAG,
    collectionSchemas
};

// Uncomment to run examples
// examples();