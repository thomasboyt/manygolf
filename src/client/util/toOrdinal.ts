// found here http://forums.shopify.com/categories/2/posts/29259

export default function getOrdinal(n: number) {
   var s=["th","st","nd","rd"],
       v=n%100;
   return n+(s[(v-20)%10]||s[v]||s[0]);
}