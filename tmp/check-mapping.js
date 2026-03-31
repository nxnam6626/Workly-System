const { Client } = require('@elastic/elasticsearch');

async function main() {
  const client = new Client({
    node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
  });

  try {
    const mapping = await client.indices.getMapping({ index: 'jobs' });
    console.log(JSON.stringify(mapping.body.jobs.mappings.properties, null, 2));
  } catch (error) {
    console.error('Error getting mapping:', error.message);
  }
}

main();
