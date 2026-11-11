// Create constraints
CREATE CONSTRAINT destination_id IF NOT EXISTS FOR (d:Destination) REQUIRE d.id IS UNIQUE;
CREATE CONSTRAINT travel_id IF NOT EXISTS FOR (t:Travel) REQUIRE t.id IS UNIQUE;

// Create indexes
CREATE INDEX destination_name IF NOT EXISTS FOR (d:Destination) ON (d.name);
CREATE INDEX destination_country IF NOT EXISTS FOR (d:Destination) ON (d.country);

// Sample data - Destinations
CREATE (paris:Destination {id: 'dest-1', name: 'Paris', country: 'France', city: 'Paris', popularity: 95})
CREATE (rome:Destination {id: 'dest-2', name: 'Rome', country: 'Italy', city: 'Rome', popularity: 90})
CREATE (barcelona:Destination {id: 'dest-3', name: 'Barcelona', country: 'Spain', city: 'Barcelona', popularity: 88})
CREATE (london:Destination {id: 'dest-4', name: 'London', country: 'UK', city: 'London', popularity: 92})

// Create relationships - Popular routes
CREATE (paris)-[:CONNECTS_TO {distance_km: 1105, travel_time_hours: 11}]->(rome)
CREATE (rome)-[:CONNECTS_TO {distance_km: 1360, travel_time_hours: 14}]->(barcelona)
CREATE (barcelona)-[:CONNECTS_TO {distance_km: 1140, travel_time_hours: 12}]->(paris)
CREATE (paris)-[:CONNECTS_TO {distance_km: 344, travel_time_hours: 2.5}]->(london)
CREATE (london)-[:CONNECTS_TO {distance_km: 1450, travel_time_hours: 15}]->(rome);
