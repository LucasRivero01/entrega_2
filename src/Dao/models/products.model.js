import mongoose from 'mongoose';
import mongoosePaginate from "mongoose-paginate-v2";
const productsCollection = 'products';

const productSchema = new mongoose.Schema({
   title: {
      type: String,
      require: true
   },
   description: {
      type: String,
      require: true
   },
   price: {
      type: Number,
      require: true
   },
   thumbnail: {
      type: String,
      require: false
   },
   code: {
      type: String,
      require: true
   },
   stock: {
      type: Number,
      require: true
   },
   id: {
      type: Number,
      require: true
   },
   category: {
      type: String,
      require: true
   },
   status: {
      type: Boolean,
      require: true
   },
})

productSchema.plugin(mongoosePaginate)

const productModel = mongoose.model(productsCollection, productSchema);
export default productModel;