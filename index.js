require('dotenv').config(); 
// At the top of your file
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Make sure to check if the API key is available
if (!OPENAI_API_KEY) {
  console.error('OpenAI API key is not defined. Make sure you have set it in your environment.');
  process.exit(1); // Exit the process if the API key is not available
}

const express = require('express');
const http = require('http');
const { OpenAI } = require('langchain/llms/openai');
const { RetrievalQAChain } = require('langchain/chains');
// const { HNSWLib } = require('langchain/vectorstores/hnswlib');
const { MemoryVectorStore } = require("langchain/vectorstores/memory");
const { OpenAIEmbeddings } = require('langchain/embeddings/openai');
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');
const fs = require('fs');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());
app.use('/', express.static(__dirname));

const apiKey = process.env.OPENAI_API_KEY; // Replace with your actual OpenAI API key

// Initialize LangChain components
const text = fs.readFileSync('./aws_svs.txt', 'utf8');
const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000 });

(
  

  
  async () => {
  let docs;
  try {
    docs = await textSplitter.createDocuments([text]);
  } catch (error) {
    console.error('Error creating documents:', error);
    process.exit(1);
  }

  const vectorStore = await MemoryVectorStore.fromDocuments(docs, new OpenAIEmbeddings());
  const vectorStoreRetriever = vectorStore.asRetriever();
  // let vectorStoreRetriever;/
  const model = new OpenAI({ apiKey });


  app.use('/ping', (req, res) => {
    // Send a successful response with status code 200 and "hello" as the body
    res.status(200).send('hello');
  })
  

  // Define a route to handle queries
  app.post('/query', async (req, res) => {
    const chain = RetrievalQAChain.fromLLM(model, vectorStoreRetriever);
    try {
      const response = await chain.call({ query: req.body.query });
      res.json(response);
    } catch (error) {
      console.error('Error:', error);
      res.status(500).send('An error occurred while processing your request.');
    }
  });

  // Start the server
  const port = 3001;
  const server = http.createServer(app);
  server.listen(port, () => console.log(`Server started on port localhost:${port}`));
})();
