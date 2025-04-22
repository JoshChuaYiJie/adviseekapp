import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { Facebook, Instagram, Send, MessageCircle } from "lucide-react";

type Post = {
  id: string;
  title: string;
  content: string;
  user_id: string;
  created_at: string;
  user_email?: string;
};

const CommunityPage: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState({ title: '', content: '' });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const postsWithEmails = await Promise.all(
        data.map(async (post) => {
          const { data: userData } = await supabase.auth.getUser(post.user_id);
          return { ...post, user_email: userData.user?.email };
        })
      );

      setPosts(postsWithEmails);
    } catch (error) {
      toast.error("Failed to fetch community posts");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("You must be logged in to create a post");
      return;
    }

    try {
      const { error } = await supabase.from('community_posts').insert({
        title: newPost.title,
        content: newPost.content,
        user_id: user.id
      });

      if (error) throw error;

      toast.success("Post created successfully");
      setNewPost({ title: '', content: '' });
      fetchPosts();
    } catch (error) {
      toast.error("Failed to create post");
      console.error(error);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 bg-soft-purple rounded-lg p-6 text-center">
        <h2 className="text-2xl font-bold mb-4">Join Our Community!</h2>
        <p className="text-gray-600 mb-4">
          Stay updated and connect with other students
        </p>
        <div className="flex justify-center space-x-4">
          <a 
            href="https://t.me/adviseek" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:bg-soft-gray p-2 rounded-full transition-colors"
          >
            <Send size={32} className="text-[#2AABEE]" />
          </a>
          <a 
            href="https://discord.gg/adviseek" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:bg-soft-gray p-2 rounded-full transition-colors"
          >
            <MessageCircle size={32} className="text-[#5865F2]" />
          </a>
          <a 
            href="https://facebook.com/adviseek" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:bg-soft-gray p-2 rounded-full transition-colors"
          >
            <Facebook size={32} className="text-[#1877F2]" />
          </a>
          <a 
            href="https://instagram.com/adviseek" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:bg-soft-gray p-2 rounded-full transition-colors"
          >
            <Instagram size={32} className="text-[#E1306C]" />
          </a>
        </div>
      </div>

      <h1 className="text-3xl font-bold mb-6">Community Discussions</h1>

      <form onSubmit={handleCreatePost} className="mb-8 p-6 bg-white shadow-md rounded-lg">
        <Input
          placeholder="Post Title"
          value={newPost.title}
          onChange={(e) => setNewPost({...newPost, title: e.target.value})}
          className="mb-4"
          required
        />
        <Textarea
          placeholder="What would you like to discuss?"
          value={newPost.content}
          onChange={(e) => setNewPost({...newPost, content: e.target.value})}
          className="mb-4 min-h-[100px]"
          required
        />
        <Button type="submit" className="w-full">Create Post</Button>
      </form>

      <div className="space-y-4">
        {isLoading ? (
          <p>Loading posts...</p>
        ) : posts.length === 0 ? (
          <p className="text-center text-gray-500">No posts yet. Be the first to start a discussion!</p>
        ) : (
          posts.map((post) => (
            <div 
              key={post.id} 
              className="bg-white shadow-md rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <h2 className="text-xl font-semibold mb-2">{post.title}</h2>
              <p className="text-gray-600 mb-4">{post.content}</p>
              <div className="text-sm text-gray-500">
                Posted by {post.user_email || 'Anonymous'} 
                {' '} on {new Date(post.created_at).toLocaleDateString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommunityPage;
