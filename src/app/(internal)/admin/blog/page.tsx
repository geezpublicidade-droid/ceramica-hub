import { requireAdminPage } from "@/lib/auth-guards";
import { getAllPostsForAdmin } from "@/lib/services/blog";
import { NewBlogPostForm } from "@/components/admin/NewBlogPostForm";
import { BlogPostRow } from "@/components/admin/BlogPostRow";
import { BackLink } from "@/components/nav/BackLink";

export const metadata = { title: "Blog — Cerâmica Hub" };

export default async function AdminBlogPage() {
  await requireAdminPage(["super_admin", "admin"]);
  const posts = await getAllPostsForAdmin();

  return (
    <main className="min-h-screen bg-background px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Blog</h1>
            <p className="mt-2 text-[16px] text-muted">
              Posts editoriais do Cerâmica Hub. Rascunho não aparece no site até publicar.
            </p>
          </div>
          <BackLink href="/admin" />
        </div>

        <div className="mt-10">
          <NewBlogPostForm />
        </div>

        <section className="mt-10 flex flex-col gap-3">
          <p className="text-[17px] font-semibold text-foreground">Posts ({posts.length})</p>
          {posts.length === 0 && <p className="text-[15px] text-muted">Nenhum post ainda.</p>}
          {posts.map((post) => (
            <BlogPostRow key={post.id} post={post} />
          ))}
        </section>
      </div>
    </main>
  );
}
