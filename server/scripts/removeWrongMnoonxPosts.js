require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Post = require('../models/Post');
const User = require('../models/User');

const IDS = ['6a0675e5077a2470929eb722', '6a0675e4077a2470929eb721'];

(async () => {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 60000 });
  const r = await Post.deleteMany({ _id: { $in: IDS } });
  const u = await User.findOne({ username: 'malvinalord' });
  if (u) {
    const n = await Post.countDocuments({ author: u._id.toString() });
    await User.findByIdAndUpdate(u._id, { postsCount: n });
    console.log('Removed:', r.deletedCount, 'Remaining malvinalord posts:', n);
  }
  await mongoose.disconnect();
})();
