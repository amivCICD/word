FROM node:18 AS frontend-builder 
WORKDIR /frontend
COPY ./package*.json /frontend/
RUN npm i
COPY . /frontend/
RUN npm run buildCSS
RUN npm run build

FROM maven:3.8.6-eclipse-temurin-17 AS backend-builder 
WORKDIR /backend
COPY ./server/pom.xml /backend/
COPY ./server /backend/
RUN mvn clean install
RUN mvn clean package -DskipTests
COPY ./server/target/chicwordle.db /backend/
COPY ./server/target/chicwordle_server-1.0.0.jar /backend/
EXPOSE 1985 
CMD ["java", "-jar", "chicwordle_server-1.0.0.jar"]

