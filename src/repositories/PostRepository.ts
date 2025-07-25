import Post, { IPost } from '../entities/Post';

class PostRepository {
   async create(data: Partial<IPost>) {
      const post = new Post(data);
      return await post.save();
   }

   async findById(id: string) {
      return await Post.findOne({ id });
   }

   async findByTicker(ticker: string) {
      return await Post.find({ ticker });
   }

   async findAll() {
      return await Post.find();
   }

   async update(id: string, data: Partial<IPost>) {
      return await Post.findOneAndUpdate({ id }, data, { new: true });
   }

   async delete(id: string) {
      return await Post.findOneAndDelete({ id });
   }
}

export default new PostRepository();
