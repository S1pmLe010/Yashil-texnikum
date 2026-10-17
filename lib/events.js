import { EventEmitter } from 'events';

// Bitta Node jarayoni ichida ishlaydi (next start / VPS). Serverless'da bir nechta
// nusxa bo'lsa, Redis pub/sub yoki MongoDB change streams'ga almashtiring.
const bus = global._chatBus || (global._chatBus = new EventEmitter());
bus.setMaxListeners(0);

export default bus;
