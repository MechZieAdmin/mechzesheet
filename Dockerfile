# Stage 1: Build the React frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Build the Spring Boot backend
FROM maven:3.9-eclipse-temurin-21 AS backend-builder
WORKDIR /app/server
COPY spring-server/pom.xml ./
COPY spring-server/src ./src
# Copy the built frontend into Spring Boot's static resources
COPY --from=frontend-builder /app/client/dist /app/server/src/main/resources/static
# Package the application
RUN mvn clean package -DskipTests

# Stage 3: Run the application
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=backend-builder /app/server/target/*.jar app.jar
EXPOSE 9088
ENTRYPOINT ["java", "-jar", "app.jar"]
