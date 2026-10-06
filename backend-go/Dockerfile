FROM golang:1.22-alpine

WORKDIR /app

# Inicializa el módulo de Go si no existe previamente
COPY go.mod ./
RUN go mod download || true

COPY . .

RUN go build -o main .

EXPOSE 8080

CMD ["./main"]