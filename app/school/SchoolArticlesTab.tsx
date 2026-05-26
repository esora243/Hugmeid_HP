import Image from "next/image";
import Link from "next/link";
import { BookOpen, Search } from "lucide-react";
import type { SchoolArticle } from "./school-workspace-shared";

type SchoolArticlesTabProps = {
  searchQuery: string;
  selectedCategory: string;
  categories: string[];
  articles: SchoolArticle[];
  onSearchQueryChange: (value: string) => void;
  onSelectedCategoryChange: (value: string) => void;
};

export function SchoolArticlesTab({
  searchQuery,
  selectedCategory,
  categories,
  articles,
  onSearchQueryChange,
  onSelectedCategoryChange,
}: SchoolArticlesTabProps) {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="relative px-1">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input type="text" placeholder="記事を検索..." value={searchQuery} onChange={(event) => onSearchQueryChange(event.target.value)} className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 sm:text-sm transition-colors" />
      </div>

      <div className="flex gap-2 overflow-x-auto px-1 pb-1 hide-scrollbar">
        {categories.map((category) => (
          <button key={category} onClick={() => onSelectedCategoryChange(category)} className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-colors border ${selectedCategory === category ? "bg-gray-800 border-gray-800 text-white" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`}>{category}</button>
        ))}
      </div>

      {articles.length === 0 ? (
        <div className="bg-white rounded-2xl border border-pink-100 p-8 text-center">
          <BookOpen className="mx-auto text-pink-200 mb-3" size={40} />
          <p className="font-bold text-gray-800 mb-2">勉強系記事はまだありません</p>
          <p className="text-sm text-gray-500">schoolArticles に本番記事を追加すると、ここに表示されます。</p>
        </div>
      ) : (
        articles.map((article) => (
          <Link key={article.id} href={`/school/articles/${article.id}`} prefetch={false} className="block bg-white rounded-2xl shadow-sm border border-pink-50 overflow-hidden hover:shadow-md transition-shadow group">
            <div className="flex gap-4 p-4">
              <div className="relative w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-gray-100">
                {article.image ? (
                  <Image
                    src={article.image}
                    alt={article.title}
                    fill
                    sizes="96px"
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : null}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-50 text-purple-600 rounded">{article.category}</span>
                  <span className="text-[10px] text-gray-400">{article.date}</span>
                </div>
                <h3 className="font-bold text-gray-800 leading-tight line-clamp-2 group-hover:text-pink-600 transition-colors">{article.title}</h3>
                {article.excerpt ? <p className="text-xs text-gray-500 mt-2 line-clamp-2">{article.excerpt}</p> : null}
              </div>
            </div>
          </Link>
        ))
      )}
    </div>
  );
}
