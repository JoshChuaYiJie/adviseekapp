
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { useTranslation } from 'react-i18next';

type Profile = {
  username: string;
};

type Comment = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  username?: string;
};

type Post = {
  id: string;
  title: string;
  content: string;
  user_id: string;
  created_at: string;
  username?: string;
  community?: string;
};

export const PostDetails = () => {
  const { t } = useTranslation();
  const { postId } = useParams();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsername = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', userId)
      .single();
    
    return data?.username || `user${userId.substring(0, 4)}`;
  };

  const fetchPostAndComments = async () => {
    if (!postId) return;
    
    try {
      const { data: postData, error: postError } = await supabase
        .from('community_posts')
        .select('*')
        .eq('id', postId)
        .single();

      if (postError) throw postError;

      const username = await fetchUsername(postData.user_id);
      const postWithUsername = { ...postData, username };
      setPost(postWithUsername);

      const { data: commentsData, error: commentsError } = await supabase
        .from('community_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (commentsError) throw commentsError;

      const commentsWithUsernames = await Promise.all(
        commentsData.map(async (comment) => {
          const username = await fetchUsername(comment.user_id);
          return { ...comment, username };
        })
      );

      setComments(commentsWithUsernames);
    } catch (error) {
      toast.error("Failed to fetch post details");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPostAndComments();
  }, [postId]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("You must be logged in to comment");
      return;
    }

    try {
      const { error } = await supabase.from('community_comments').insert({
        content: newComment,
        post_id: postId,
        user_id: user.id
      });

      if (error) throw error;

      toast.success("Comment added successfully");
      setNewComment('');
      fetchPostAndComments();
    } catch (error) {
      toast.error("Failed to add comment");
      console.error(error);
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!post) {
    return <div className="p-6">Post not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
        {post && (
          <>
            <h1 className="text-2xl font-bold mb-4">{post.title}</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-4 whitespace-pre-wrap">{post.content}</p>
            <div className="text-sm text-gray-500">
              {t('community.posted_by')} {post.username} {t('community.on')} {new Date(post.created_at).toLocaleDateString()}
            </div>
          </>
        )}
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">{t('community.comments')}</h2>
        
        <form onSubmit={handleAddComment} className="mb-6">
          <Textarea
            placeholder={t('community.write_comment')}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="mb-2"
            required
          />
          <Button type="submit">{t('community.add_comment')}</Button>
        </form>

        <div className="space-y-4">
          {comments.length === 0 ? (
            <p className="text-gray-500">{t('community.no_comments')}</p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <p className="mb-2">{comment.content}</p>
                <div className="text-sm text-gray-500">
                  {t('community.posted_by')} {comment.username} {t('community.on')} {new Date(comment.created_at).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
