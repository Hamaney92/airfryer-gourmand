import { getPublishedRecipes, totalTime } from '../../lib/site';
import { eligible } from '../../lib/meal-search.mjs';
export async function GET() {
  const recipes = (await getPublishedRecipes()).map(r=>({id:r.id,title:r.data.title,category:r.data.category,ingredients:r.data.ingredients,minutes:totalTime(r),servings:r.data.servings,image:r.data.image || null})).filter(eligible);
  return Response.json(recipes,{headers:{'Cache-Control':'public, max-age=300','X-Robots-Tag':'noindex'}});
}
