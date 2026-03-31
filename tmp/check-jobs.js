const { Client } = require('@elastic/elasticsearch');

async function main() {
  const client = new Client({
    node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
  });

  try {
    const result = await client.search({
      index: 'jobs',
      size: 5,
      body: {
        query: { match_all: {} }
      }
    });

    console.log('Total jobs:', result.body.hits.total.value);
    result.body.hits.hits.forEach((hit, i) => {
      console.log(`Job ${i+1}:`, JSON.stringify(hit._source, null, 2));
    });
  } catch (error) {
    console.error('Search failed:', error.message);
  }
}

main();
