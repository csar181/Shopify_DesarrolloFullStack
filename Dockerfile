# Imagen del backend de ShopCloud para desplegar (Render u otro servicio con Docker).
# Se construye desde la raíz del repositorio porque también copia los scripts de database/.

FROM eclipse-temurin:22-jdk AS build
WORKDIR /app
COPY backend/ .
RUN sed -i 's/\r$//' mvnw && chmod +x mvnw && ./mvnw -q -B -DskipTests package

FROM eclipse-temurin:22-jre
RUN apt-get update \
    && apt-get install -y --no-install-recommends postgresql-client \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
COPY database/*.sql database/
COPY backend/docker-entrypoint.sh .
RUN sed -i 's/\r$//' docker-entrypoint.sh && chmod +x docker-entrypoint.sh
EXPOSE 8080
ENTRYPOINT ["/app/docker-entrypoint.sh"]
