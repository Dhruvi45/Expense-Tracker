export const dynamic = "force-dynamic";

import { getCategories, deleteCategory } from "./actions";
import { CategoryForm } from "@/components/category-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2 } from "lucide-react";

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="text-muted-foreground">
            Manage your expense categories
          </p>
        </div>
        <CategoryForm />
      </div>

      {categories.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">
              No categories yet. Add your first category to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <Card key={cat._id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div
                    className="h-8 w-8 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="font-medium">{cat.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <CategoryForm category={cat} />
                  <DeleteCategoryButton id={cat._id} name={cat.name} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function DeleteCategoryButton({ id, name }: { id: string; name: string }) {
  async function handleDelete() {
    "use server";
    const result = await deleteCategory(id);
    if (result.error) {
      // We can't show client-side errors from server actions in this pattern easily,
      // so we'll just return - the category won't be deleted if it has expenses
    }
  }

  return (
    <form action={handleDelete}>
      <Button variant="ghost" size="icon" type="submit" title={`Delete ${name}`}>
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </form>
  );
}
