// Run this script with: node migrate_address_field.js
const mongoose = require('mongoose');
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/finmark';

async function migrate() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const users = await User.find({});
  let updated = 0;

  for (const user of users) {
    if (user.shippingAddresses && user.shippingAddresses.length > 0) {
      // Use the first shipping address as the address
      user.address = user.shippingAddresses[0];
      user.shippingAddresses = undefined;
      await user.save();
      updated++;
    } else if (!user.address) {
      // Set empty address if none exists
      user.address = {
        street: '',
        barangay: '',
        city: '',
        province: '',
        zipCode: '',
        country: 'Philippines'
      };
      user.shippingAddresses = undefined;
      await user.save();
      updated++;
    }
  }

  console.log(`Migration complete. Updated ${updated} users.`);
  await mongoose.disconnect();
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
}); 