import mongoose from 'mongoose';
import MenuItem from './models/MenuItem.js';

async function test() {
  await mongoose.connect('mongodb://127.0.0.1:27017/dimkoiqueue');
  const items = await MenuItem.find();
  console.log("Items count:", items.length);
  const firstItem = items[0];
  console.log("First item id:", firstItem?.id);
  
  if (firstItem) {
      const res = await MenuItem.findOneAndUpdate({ id: firstItem.id }, { name: "TEST NAME" });
      console.log("FindOneAndUpdate result:", res ? "Found" : "Not Found");
      const updated = await MenuItem.findOne({ id: firstItem.id });
      console.log("Updated name:", updated.name);
  }
  process.exit(0);
}
test();
