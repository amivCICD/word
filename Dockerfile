FROM node:18 AS frontend-builder
WORKDIR /frontend
COPY ./package*.json /frontend/
RUN npm i
COPY . /frontend/
RUN npm run buildCSS
RUN npm run build

FROM maven:3.8.6-eclipse-temurin-17 AS backend-builder
WORKDIR /backend
COPY ./server_refactor/pom.xml /backend/pom.xml
COPY ./server_refactor /backend
COPY --from=frontend-builder /frontend/server_refactor/src/main/resources/static /backend/src/main/resources/static
COPY ./server/chicwordle.db /backend/../server/chicwordle.db
RUN mvn clean package -DskipTests

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=backend-builder /backend/target/chicwordle_server_refactor-1.0.0.jar /app/chicwordle_server_refactor-1.0.0.jar
COPY --from=backend-builder /backend/../server/chicwordle.db /app/server/chicwordle.db
EXPOSE 1985
CMD ["java", "-jar", "/app/chicwordle_server_refactor-1.0.0.jar", "--app.sqlite.path=/app/server/chicwordle.db", "--server.port=1985"]
