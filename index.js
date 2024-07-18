const express = require("express");
const app = express();
const { graphqlHTTP } = require("express-graphql");
const {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLList,
  GraphQLInt,
  GraphQLNonNull,
} = require("graphql");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const port = 5000;

const BookType = new GraphQLObjectType({
  name: "Book",
  description: "This represents a book written by an author",
  fields: () => ({
    id: { type: GraphQLNonNull(GraphQLInt) },
    title: { type: GraphQLNonNull(GraphQLString) },
    genre: { type: GraphQLNonNull(GraphQLString) },
    author_id: { type: GraphQLNonNull(GraphQLInt) },
    author: {
      type: AuthorType,
      resolve: async (book) => {
        return await prisma.authors.findMany({ where: { id: book.author_id } });
      },
    },
  }),
});

const AuthorType = new GraphQLObjectType({
  name: "Author",
  description: "A list of all the authors",
  fields: () => ({
    id: { type: GraphQLNonNull(GraphQLInt) },
    name: { type: GraphQLNonNull(GraphQLString) },
    date_of_birth: { type: GraphQLNonNull(GraphQLString) },
    country: { type: GraphQLNonNull(GraphQLString) },
    books: {
      type: GraphQLList(BookType),
      resolve: async (author) => {
        return await prisma.books.findMany({ where: { author_id: author.id } });
      },
    },
  }),
});

const RootQueryType = new GraphQLObjectType({
  name: "Query",
  description: "Root Query",
  fields: () => ({
    book: {
      type: BookType,
      description: "A Single Book",
      args: {
        id: { type: GraphQLInt },
      },
      resolve: async (parent, args) =>
        await prisma.books.findUnique({ wwhere: { id: args.id } }),
    },
    books: {
      type: new GraphQLList(BookType),
      description: "A list of books",
      resolve: async () => await prisma.books.findMany(),
    },
    author: {
      type: AuthorType,
      description: "A Single Author",
      args: {
        id: { type: GraphQLInt },
      },
      resolve: async (parent, args) =>
        await prisma.authors.findUnique({ where: { id: args.id } }),
    },
    authors: {
      type: new GraphQLList(AuthorType),
      description: "A list of authors",
      resolve: async () => await prisma.authors.findMany(),
    },
  }),
});

const RootMutationType = new GraphQLObjectType({
  name: "Mutation",
  description: "Root Mutation",
  fields: () => ({
    addBook: {
      type: BookType,
      description: "Add a book",
      args: {
        title: { type: GraphQLNonNull(GraphQLString) },
        genre: { type: GraphQLNonNull(GraphQLString) },
        author_id: { type: GraphQLNonNull(GraphQLInt) },
      },
      resolve: async (parent, args) => {
        await prisma.books.create({
          data: {
            title: args.title,
            genre: args.genre,
            author: {
              connect: { id: args.author_id },
            },
          },
        });
        return {
          title: args.title,
          genre: args.genre,
          author_id: args.author_id,
        };
      },
    },
    addAuthor: {
      type: AuthorType,
      description: "Add an Author",
      args: {
        name: { type: GraphQLNonNull(GraphQLString) },
        date_of_birth: { type: GraphQLNonNull(GraphQLString) },
        country: { type: GraphQLNonNull(GraphQLString) },
      },
      resolve: async (parent, args) => {
        await prisma.authors.create({
          data: {
            name: args.name,
            date_of_birth: new Date(args.date_of_birth),
            country: args.country,
          },
        });
        return {
          name: args.name,
          date_of_birth: args.date_of_birth,
          country: args.country,
        };
      },
    },
  }),
});

const schema = new GraphQLSchema({
  query: RootQueryType,
  mutation: RootMutationType,
});

app.use(
  "/graphql",
  graphqlHTTP({
    schema: schema,
    graphiql: true,
  })
);

app.get("/", async (req, res) => {
  return res.json({ message: "Hello World", success: true });
});

app.listen(port, () => {
  console.log(`Our app is running on http://localhost:${port}`);
});
