const kafka = require('kafka-node');

const client = new kafka.KafkaClient({ kafkaHost: process.env.KAFKA_BROKER });
const producer = new kafka.Producer(client);

producer.on('ready', () => console.log('Kafka Producer siap'));
producer.on('error', (err) => console.error('Kafka Error:', err));

const sendToKafka = (topic, message) => {
  const payloads = [{ topic, messages: JSON.stringify(message) }];
  producer.send(payloads, (err, data) => {
    if (err) console.error('Gagal mengirim ke Kafka:', err);
    else console.log('Pesan terkirim ke Kafka:', data);
  });
};

module.exports = sendToKafka;
