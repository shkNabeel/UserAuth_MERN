class BlogDTO {
    constructor(blog) {
        this._id=blog._id;
        this.title=blog.title;
        this.content=blog.content;
        this.author=blog.author;
        this.photoPath=blog.photoPath;
    }
}

module.exports = BlogDTO;
