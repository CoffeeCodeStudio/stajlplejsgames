import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Newspaper, ChevronRight } from "lucide-react";
import { BentoCard } from "../home/BentoCard";

interface NewsArticle {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  icon: string;
  author_name: string;
  created_at: string;
}

function isRecent(dateStr: string) {
  return Date.now() - new Date(dateStr).getTime() < 48 * 60 * 60 * 1000;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
}

export function NewsFeed() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);

  useEffect(() => {
    const fetchArticles = async () => {
      const { data } = await supabase
        .from("news_articles")
        .select("id, title, content, image_url, icon, author_name, created_at")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(2);
      if (data) setArticles(data as NewsArticle[]);
    };
    fetchArticles();
  }, []);

  return (
    <div className="glass-card flex flex-col h-full">
      <div className="relative z-10 flex items-center gap-2 px-4 py-2.5 border-b border-[hsl(var(--glass-border))]">
        <Newspaper className="w-4 h-4 text-primary" />
        <h3 className="font-display font-bold text-sm text-foreground tracking-wide">Senaste Nytt</h3>
      </div>
      <div className="relative z-10 divide-y divide-[hsl(var(--glass-border))] flex-1">
        {articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-6 text-muted-foreground">
            <Newspaper className="w-8 h-8 mb-2 opacity-30" />
            <span className="text-xs">Inga nyheter ännu</span>
          </div>
        ) : (
          articles.map((article) => (
            <Link
              to={`/news/${article.id}`}
              key={article.id}
              className="pressable p-3.5 flex gap-3 hover:bg-muted/20 transition-colors cursor-pointer block group"
            >
              {article.image_url ? (
                <img
                  src={article.image_url}
                  alt=""
                  loading="lazy"
                  className="w-10 h-10 rounded-xl object-cover flex-shrink-0 border border-[hsl(var(--glass-border))]"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-xl">
                  {article.icon}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{article.icon}</span>
                  <span className="font-bold text-sm truncate group-hover:text-primary transition-colors">{article.title}</span>
                  {isRecent(article.created_at) && (
                    <span className="px-1.5 py-0.5 text-[9px] font-bold bg-primary/20 text-primary rounded-full">NY!</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{article.content}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-muted-foreground/60">
                    {formatDate(article.created_at)} · {article.author_name}
                  </span>
                  <span className="text-[10px] text-primary font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                    Läs mer <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
      <Link
        to="/news"
        className="pressable relative z-10 flex items-center justify-center gap-1 py-2.5 text-xs font-bold text-primary hover:bg-primary/10 transition-colors border-t border-[hsl(var(--glass-border))]"
      >
        Visa alla nyheter <ChevronRight className="w-3 h-3" />
      </Link>
    </div>
  );
}
