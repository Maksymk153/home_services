document.addEventListener('DOMContentLoaded', async function() {
    const grid = document.getElementById('blogGrid');
    const loading = document.getElementById('blogLoading');
    const emptyState = document.getElementById('blogEmptyState');

    if (!grid) {
        return;
    }

    const showGrid = () => {
        if (loading) loading.style.display = 'none';
        if (emptyState) emptyState.style.display = 'none';
        grid.style.display = 'grid';
    };

    const showEmpty = () => {
        if (loading) loading.style.display = 'none';
        if (grid) grid.style.display = 'none';
        if (emptyState) emptyState.style.display = 'block';
    };

    try {
        const response = await fetch('/api/blogs');
        if (!response.ok) {
            throw new Error('Failed to fetch blog posts');
        }

        const data = await response.json();
        const blogs = data.blogs || [];

        if (!blogs.length) {
            showEmpty();
            return;
        }

        grid.innerHTML = '';

        blogs.forEach(blog => {
            const card = document.createElement('div');
            card.className = 'blog-card';

            const icon = blog.coverImage
                ? `<div class="blog-image" style="background-image: url('${blog.coverImage}'); background-size: cover; background-position: center;"></div>`
                : `<div class="blog-image"><i class="fas fa-newspaper"></i></div>`;

            const publishedDate = blog.publishedAt || blog.createdAt;
            const formattedDate = publishedDate ? new Date(publishedDate).toLocaleDateString() : 'Unpublished';
            const tags = Array.isArray(blog.tags) && blog.tags.length ? ` • ${blog.tags.join(', ')}` : '';

            card.innerHTML = `
                ${icon}
                <div class="blog-content">
                    <div class="blog-meta"><i class="fas fa-calendar"></i> ${formattedDate}${tags}</div>
                    <h3>${blog.title || 'Untitled Post'}</h3>
                    <p>${blog.summary || ''}</p>
                    <a href="#" class="read-more" data-slug="${blog.slug}">
                        Read More <i class="fas fa-arrow-right"></i>
                    </a>
                </div>
            `;

            grid.appendChild(card);
        });

        showGrid();
    } catch (error) {
        console.error('Blog load error:', error);
        showEmpty();
        if (emptyState) {
            emptyState.querySelector('h3').textContent = 'Unable to load blog posts';
            const paragraph = emptyState.querySelector('p');
            if (paragraph) {
                paragraph.textContent = 'Please try again later. If the issue persists, contact CityLocal 101 support.';
            }
        }
    }
});


