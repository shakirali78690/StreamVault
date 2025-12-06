import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { MessageCircle, Send, Reply, ChevronDown, ChevronUp } from "lucide-react";
import type { Comment } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface CommentsSectionProps {
  episodeId?: string;
  movieId?: string;
}

interface CommentWithReplies extends Comment {
  replies?: CommentWithReplies[];
}

// Single comment component with reply functionality
function CommentItem({ 
  comment, 
  episodeId, 
  movieId, 
  userName, 
  setUserName,
  depth = 0 
}: { 
  comment: CommentWithReplies; 
  episodeId?: string; 
  movieId?: string;
  userName: string;
  setUserName: (name: string) => void;
  depth?: number;
}) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [showReplies, setShowReplies] = useState(true);
  const queryClient = useQueryClient();

  const postReply = useMutation({
    mutationFn: async (data: { userName: string; comment: string; parentId: string }) => {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          episodeId,
          movieId,
          parentId: data.parentId,
          userName: data.userName,
          comment: data.comment,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to post reply: ${response.status}`);
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: episodeId 
          ? [`/api/comments/episode/${episodeId}`]
          : [`/api/comments/movie/${movieId}`],
      });
      setReplyText("");
      setShowReplyForm(false);
      localStorage.setItem("streamvault_username", userName);
    },
  });

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !replyText.trim()) return;
    postReply.mutate({ 
      userName: userName.trim(), 
      comment: replyText.trim(), 
      parentId: comment.id 
    });
  };

  const hasReplies = comment.replies && comment.replies.length > 0;

  return (
    <div className={depth > 0 ? "ml-6 border-l-2 border-muted pl-4" : ""}>
      <Card className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="font-semibold">{comment.userName}</p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
        <p className="text-sm whitespace-pre-wrap break-words mb-3">{comment.comment}</p>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowReplyForm(!showReplyForm)}
            className="text-xs"
          >
            <Reply className="w-3 h-3 mr-1" />
            Reply
          </Button>
          
          {hasReplies && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowReplies(!showReplies)}
              className="text-xs"
            >
              {showReplies ? (
                <>
                  <ChevronUp className="w-3 h-3 mr-1" />
                  Hide {comment.replies!.length} {comment.replies!.length === 1 ? 'reply' : 'replies'}
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3 mr-1" />
                  Show {comment.replies!.length} {comment.replies!.length === 1 ? 'reply' : 'replies'}
                </>
              )}
            </Button>
          )}
        </div>

        {/* Reply Form */}
        {showReplyForm && (
          <form onSubmit={handleReplySubmit} className="mt-4 space-y-3">
            {!userName && (
              <Input
                type="text"
                placeholder="Your name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                maxLength={50}
                required
              />
            )}
            <Textarea
              placeholder={`Reply to ${comment.userName}...`}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={2}
              maxLength={1000}
              required
            />
            <div className="flex gap-2">
              <Button
                type="submit"
                size="sm"
                disabled={postReply.isPending || !userName.trim() || !replyText.trim()}
              >
                <Send className="w-3 h-3 mr-1" />
                {postReply.isPending ? "Posting..." : "Reply"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowReplyForm(false);
                  setReplyText("");
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </Card>

      {/* Nested Replies */}
      {hasReplies && showReplies && (
        <div className="mt-2 space-y-2">
          {comment.replies!.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              episodeId={episodeId}
              movieId={movieId}
              userName={userName}
              setUserName={setUserName}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function CommentsSection({ episodeId, movieId }: CommentsSectionProps) {
  const [userName, setUserName] = useState("");
  const [comment, setComment] = useState("");
  const queryClient = useQueryClient();

  // Load saved username from localStorage
  useEffect(() => {
    const savedName = localStorage.getItem("streamvault_username");
    if (savedName) {
      setUserName(savedName);
    }
  }, []);

  // Fetch comments
  const { data: comments, isLoading } = useQuery<Comment[]>({
    queryKey: episodeId 
      ? [`/api/comments/episode/${episodeId}`]
      : [`/api/comments/movie/${movieId}`],
    enabled: !!(episodeId || movieId),
  });

  // Organize comments into tree structure
  const organizeComments = (flatComments: Comment[]): CommentWithReplies[] => {
    const commentMap = new Map<string, CommentWithReplies>();
    const rootComments: CommentWithReplies[] = [];

    // First pass: create map of all comments
    flatComments.forEach(c => {
      commentMap.set(c.id, { ...c, replies: [] });
    });

    // Second pass: organize into tree
    flatComments.forEach(c => {
      const comment = commentMap.get(c.id)!;
      const parentId = (c as any).parentId; // Handle old comments without parentId
      if (parentId && commentMap.has(parentId)) {
        commentMap.get(parentId)!.replies!.push(comment);
      } else {
        rootComments.push(comment);
      }
    });

    // Sort: newest first for root comments, oldest first for replies
    rootComments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return rootComments;
  };

  const organizedComments = comments ? organizeComments(comments) : [];
  const totalComments = comments?.length || 0;

  // Post comment mutation
  const postComment = useMutation({
    mutationFn: async (data: { userName: string; comment: string }) => {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          episodeId,
          movieId,
          userName: data.userName,
          comment: data.comment,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to post comment: ${response.status}`);
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: episodeId 
          ? [`/api/comments/episode/${episodeId}`]
          : [`/api/comments/movie/${movieId}`],
      });
      setComment("");
      localStorage.setItem("streamvault_username", userName);
    },
    onError: (error) => {
      alert(`Failed to post comment: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !comment.trim()) return;
    
    postComment.mutate({ userName: userName.trim(), comment: comment.trim() });
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <MessageCircle className="w-6 h-6" />
        <h2 className="text-2xl font-bold">
          Comments {totalComments > 0 && `(${totalComments})`}
        </h2>
      </div>

      {/* Comment Form */}
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="userName" className="block text-sm font-medium mb-2">
              Your Name
            </label>
            <Input
              id="userName"
              type="text"
              placeholder="Enter your name (can be anything)"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              maxLength={50}
              required
            />
          </div>

          <div>
            <label htmlFor="comment" className="block text-sm font-medium mb-2">
              Comment
            </label>
            <Textarea
              id="comment"
              placeholder="Share your thoughts... (emojis welcome! 😊)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              maxLength={1000}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              {comment.length}/1000 characters
            </p>
          </div>

          <Button
            type="submit"
            disabled={postComment.isPending || !userName.trim() || !comment.trim()}
            className="w-full sm:w-auto"
          >
            <Send className="w-4 h-4 mr-2" />
            {postComment.isPending ? "Posting..." : "Post Comment"}
          </Button>

          {postComment.isError && (
            <p className="text-sm text-red-500 mt-2">
              Failed to post comment. Please try again.
            </p>
          )}
        </form>
      </Card>

      {/* Comments List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading comments...
          </div>
        ) : organizedComments.length > 0 ? (
          organizedComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              episodeId={episodeId}
              movieId={movieId}
              userName={userName}
              setUserName={setUserName}
            />
          ))
        ) : (
          <Card className="p-8 text-center">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">
              No comments yet. Be the first to share your thoughts!
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
