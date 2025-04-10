# API de Tarefas

Api para fins educativos.

# Como rodar localmente

1. Instalar o Docker
2. Copiar o arquivo `docker-compose.yml` localmente em uma pasta da máquina
3. Rode o comando `docker compose up`
   * Caso queira rodar sem o terminal ficar "pendurado", rode `docker compose up -d` (-d de `detached`)
4. A API estará disponível em http://localhost:3000
   * Isso pode ser mudado na linha 12 do arquivo, alterando o valor do parâmetro `ports` do lado esquerdo. Por exemplo, passando a utilizar a porta 4050:
     ```yml
     # (...)
     ports:
           - "4050:3000"
     # (...)
     ```
5. A documentação da API estará disponível em http://localhost:3000/api-docs

# Tecnologias utilizadas:

* Express
* JWT
* Swagger
* Prisma
* Zod
* Bcrypt
* MySQL
