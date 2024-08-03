class BlogDetailsDTO {
    constructor(blog) {
        this._id=blog._id;
        this.title=blog.title;
        this.content=blog.content;
        this.createdAt=blog.createdAt;
        this.photoPath=blog.photoPath;
        this.authorName=blog.author.name;
        this.authorUsername=blog.author.username;
    }
}

module.exports = BlogDetailsDTO;
