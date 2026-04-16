import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

class CommentRepo {
  async getComments(sectionCRN) {
    const comments = await prisma.comment.findMany({
      where: {
        sectionCRN,
        replyToCommentId: null // Get only top-level comments
      },
      include: {
        author: true,
        replies: {
          include: {
            author: true
          }
        }
      },
      orderBy: {
        createdDate: 'asc'
      }
    });

    // Transform the data to match the expected format
    return comments.map(comment => ({
      ...comment,
      authorName: `${comment.author.firstName} ${comment.author.lastName}`,
      replies: comment.replies.map(reply => ({
        ...reply,
        authorName: `${reply.author.firstName} ${reply.author.lastName}`
      }))
    }));
  }

  async getCommentReplies(commentId) {
    const replies = await prisma.comment.findMany({
      where: {
        replyToCommentId: parseInt(commentId)
      },
      include: {
        author: true
      },
      orderBy: {
        createdDate: 'asc'
      }
    });

    // Transform the data to match the expected format
    return replies.map(reply => ({
      ...reply,
      authorName: `${reply.author.firstName} ${reply.author.lastName}`
    }));
  }

  async addComment(comment) {
    const data = {
      title: comment.title,
      content: comment.content,
      createdDate: new Date(),
      section: {
        connect: {
          crn: comment.sectionCRN
        }
      },
      author: {
        connect: {
          id: comment.authorId
        }
      }
    };

    if (comment.replyToCommentId) {
      data.replyTo = {
        connect: {
          id: comment.replyToCommentId
        }
      };
    }

    const newComment = await prisma.comment.create({
      data,
      include: {
        author: true
      }
    });

    return {
      ...newComment,
      authorName: `${newComment.author.firstName} ${newComment.author.lastName}`
    };
  }  

  async deleteComment(commentId) {
    // First delete all replies to this comment
    await prisma.comment.deleteMany({
      where: {
        replyToCommentId: parseInt(commentId)
      }
    });

    // Then delete the comment itself
    await prisma.comment.delete({
      where: {
        id: parseInt(commentId)
      }
    });
  }
}

export default new CommentRepo();
