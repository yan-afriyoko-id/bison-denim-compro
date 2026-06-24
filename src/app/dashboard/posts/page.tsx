import { createServerSupabase } from '@/lib/supabase/server';
import { Plus, Newspaper, Calendar } from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

async function getPosts() {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false });
  return data ?? [];
}

const statusStyles: Record<string, string> = {
  published: 'bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/30',
  draft: 'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/30',
  archived: 'bg-[#666]/10 text-[#666] border-[#666]/30',
};

export default async function PostsPage() {
  const posts = await getPosts();

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#f5f5f5] tracking-tight">Posts</h1>
          <p className="text-sm text-[#666] mt-1">Kelola artikel & berita</p>
        </div>
        <Link
          href="/dashboard/posts/new"
          className="flex items-center gap-1.5 bg-[#f5f5f5] text-[#0a0a0a] px-4 py-2 text-xs font-bold rounded-sm hover:bg-white transition-colors"
        >
          <Plus className="h-4 w-4" />
          Post Baru
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="border border-dashed border-[#2a2a2a] bg-[#141414] rounded-sm py-24 flex flex-col items-center justify-center">
          <Newspaper className="h-10 w-10 text-[#3a3a3a] mb-4" />
          <p className="text-sm text-[#a3a3a3]">Belum ada post</p>
          <p className="text-xs text-[#666] mt-1">Buat post pertama Anda</p>
        </div>
      ) : (
        <div className="border border-[#2a2a2a] bg-[#141414] rounded-sm divide-y divide-[#2a2a2a]">
          {posts.map((post) => (
            <div
              key={post.id}
              className="flex items-center justify-between px-5 py-4 hover:bg-[#1c1c1c] transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link
                    href={`/dashboard/posts/${post.id}`}
                    className="text-sm font-bold text-[#f5f5f5] hover:text-white transition-colors"
                  >
                    {post.title}
                  </Link>
                  <span className={`inline-block rounded-sm border px-2 py-0.5 text-[11px] font-medium ${statusStyles[post.status] ?? statusStyles.draft}`}>
                    {post.status}
                  </span>
                </div>
                <p className="text-xs text-[#666] mt-1 truncate">
                  {post.excerpt || `/${post.slug}`}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-4">
                {post.published_at && (
                  <span className="flex items-center gap-1 text-xs text-[#666]">
                    <Calendar className="h-3 w-3" />
                    {formatDate(post.published_at)}
                  </span>
                )}
                <Link
                  href={`/dashboard/posts/${post.id}`}
                  className="text-xs font-semibold text-[#a3a3a3] hover:text-[#f5f5f5] transition-colors"
                >
                  Edit
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
