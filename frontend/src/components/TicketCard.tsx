import type { Post } from "@/types/Post";

interface PostCardProps {
  post: Post;
  onClick: () => void;
}

const TicketCard = ({ post, onClick }: PostCardProps) => {
  const firstImg =
    typeof post.images[0] === "string"
      ? post.images[0]
      : URL.createObjectURL(post.images[0]);

  return (
    <div
      onClick={onClick}
      className="cursor-pointer rounded hover:shadow-md/3 transition-all bg-white"
    >
      <img
        src={firstImg}
        alt="ticket_thumbnail"
        className="w-full h-70 object-cover rounded-t"
      />

      <div className="p-3">
        <div className="flex items-center justify-between gap-4">
          <span className="font-semibold text-lg truncate mb-2">
            {post.title}
          </span>
          <span
            className={`text-xs font-semibold capitalize px-2 py-1 rounded ${
              post.status === "resolved"
                ? "bg-green-100 text-green-700"
                : post.status === "rejected"
                ? "bg-red-100 text-red-700"
                : "bg-yellow-100 text-yellow-700"
            }`}
          >
            {post.status || "pending"}
          </span>
        </div>
        <div className="flex gap-3 mb-2">
          <p className="text-xs text-gray-500">
            Last seen location: {post.location}
          </p>
          <p className="text-xs text-gray-400">
            {post.createdAt
              ? new Date(post.createdAt).toLocaleString()
              : "Unknown date"}
          </p>
        </div>
        <span className="text-sm text-gray-600 truncate font-inter">
          {post.description}
        </span>
      </div>
    </div>
  );
};

export default TicketCard;
