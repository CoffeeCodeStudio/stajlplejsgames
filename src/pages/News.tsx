import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Newspaper, ArrowLeft, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NewsArticle {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  icon: string;
  author_name: string;
  created_at: string;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("sv-SE", { day: "numeric", month: "long", year: "numeric" });
}

function formatDateShort(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
}

/** Single article view */
function NewsArticlePage() {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchArticle = async () => {
      const { data } = await supabase
        .from("news_articles")
        .select("id, title, content, image_url, icon, author_name, created_at")
        .eq("id", id)
        .eq("is_published", true)
        .single();
      setArticle(data as NewsArticle | null);
      setLoading(false);
    };
    fetchArticle();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 text-center">
        <p className="text-muted-foreground mb-4">Artikeln hittades inte.</p>
        <Link to="/news">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-3 h-3 mr-1" /> Tillbaka till nyheter
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Link to="/news" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors mb-4">
        <ArrowLeft className="w-3 h-3" /> Alla nyheter
      </Link>

      <article className="bg-card border border-border rounded-lg overflow-hidden">
        {article.image_url && (
          <img src={article.image_url} alt="" className="w-full h-48 sm:h-64 object-cover" />
        )}
        <div className="p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">{article.icon}</span>
            <h1 className="font-display font-bold text-lg sm:text-xl text-foreground">{article.title}</h1>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" /> {formatDate(article.created_at)}
            </span>
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" /> {article.author_name}
            </span>
          </div>
          <div className="prose prose-sm max-w-none text-foreground/90 whitespace-pre-wrap leading-relaxed">
            {article.content}
          </div>
        </div>
      </article>
    </div>
  );
}

/** Archive listing */
function NewsArchive() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      const { data } = await supabase
        .from("news_articles")
        .select("id, title, content, image_url, icon, author_name, created_at")
        .eq("is_published", true)
        .order("created_at", { ascending: false });
      if (data) setArticles(data as NewsArticle[]);
      setLoading(false);
    };
    fetchAll();
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 mb-4">
        <Newspaper className="w-5 h-5 text-primary" />
        <h1 className="font-display font-bold text-lg text-foreground">Alla Nyheter</h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : articles.length === 0 ? (
        <p className="text-muted-foreground text-sm">Inga nyheter publicerade ännu.</p>
      ) : (
        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          {articles.map((article) => (
            <Link
              to={`/news/${article.id}`}
              key={article.id}
              className="p-3 flex gap-3 hover:bg-muted/30 transition-colors cursor-pointer block"
            >
              {article.image_url ? (
                <img src={article.image_url} alt="" className="w-14 h-14 rounded object-cover flex-shrink-0 border border-border" />
              ) : (
                <div className="w-14 h-14 rounded bg-primary/10 flex items-center justify-center flex-shrink-0 text-2xl">
                  {article.icon}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{article.icon}</span>
                  <span className="font-bold text-sm truncate text-foreground">{article.title}</span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{article.content}</p>
                <span className="text-[10px] text-muted-foreground/60 mt-1 block">
                  {formatDateShort(article.created_at)} · {article.author_name}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/** Router entry: /news shows archive, /news/:id shows article */
export default function News() {
  const { id } = useParams<{ id: string }>();
  return id ? <NewsArticlePage /> : <NewsArchive />;
}
