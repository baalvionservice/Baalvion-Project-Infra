'use strict';
const { v4: uuidv4 } = require('uuid');

const DEMO_ORG_ID = '00000000-0000-0000-0000-000000000001';
const DEMO_USER_ID = 1;

const siteId1 = uuidv4();
const siteId2 = uuidv4();
const cat1Id = uuidv4();
const cat2Id = uuidv4();
const contentId1 = uuidv4();
const workflowId1 = uuidv4();

module.exports = {
    async up(queryInterface) {
        const now = new Date();

        await queryInterface.bulkInsert({ tableName: 'cms_websites', schema: 'cms' }, [
            {
                id: siteId1,
                organization_id: DEMO_ORG_ID,
                name: 'Baalvion Main Blog',
                slug: 'baalvion-main-blog',
                domain: 'blog.baalvion.com',
                description: 'Main Baalvion company blog',
                status: 'active',
                plan: 'enterprise',
                modules: JSON.stringify(['pages', 'blog', 'news']),
                config: JSON.stringify({
                    defaultLanguage: 'en',
                    timezone: 'UTC',
                    dateFormat: 'MMM d, yyyy',
                    postsPerPage: 10,
                    enableComments: true,
                    enableAnalytics: true,
                    seoDefaults: { titleSuffix: '| Baalvion' },
                }),
                branding: JSON.stringify({ primaryColor: '#6366f1' }),
                created_by: DEMO_USER_ID,
                created_at: now,
                updated_at: now,
            },
            {
                id: siteId2,
                organization_id: DEMO_ORG_ID,
                name: 'Imperialpedia',
                slug: 'imperialpedia',
                domain: 'imperialpedia.baalvion.com',
                description: 'Financial knowledge base',
                status: 'active',
                plan: 'pro',
                modules: JSON.stringify(['pages', 'docs', 'blog']),
                config: JSON.stringify({
                    defaultLanguage: 'en',
                    timezone: 'UTC',
                    dateFormat: 'MMM d, yyyy',
                    postsPerPage: 20,
                    enableComments: false,
                    enableAnalytics: true,
                    seoDefaults: { titleSuffix: '| Imperialpedia' },
                }),
                branding: JSON.stringify({ primaryColor: '#0ea5e9' }),
                created_by: DEMO_USER_ID,
                created_at: now,
                updated_at: now,
            },
        ]);

        await queryInterface.bulkInsert({ tableName: 'cms_categories', schema: 'cms' }, [
            {
                id: cat1Id,
                website_id: siteId1,
                parent_id: null,
                name: 'Company News',
                slug: 'company-news',
                description: 'Official Baalvion announcements',
                seo_metadata: JSON.stringify({}),
                sort_order: 0,
                depth: 0,
                status: 'active',
                content_count: 1,
                created_at: now,
                updated_at: now,
            },
            {
                id: cat2Id,
                website_id: siteId1,
                parent_id: null,
                name: 'Engineering',
                slug: 'engineering',
                description: 'Technical deep-dives',
                seo_metadata: JSON.stringify({}),
                sort_order: 1,
                depth: 0,
                status: 'active',
                content_count: 0,
                created_at: now,
                updated_at: now,
            },
        ]);

        await queryInterface.bulkInsert({ tableName: 'cms_website_members', schema: 'cms' }, [
            {
                website_id: siteId1,
                user_id: DEMO_USER_ID,
                role: 'cms_admin',
                invited_by: null,
                joined_at: now,
                created_at: now,
                updated_at: now,
            },
            {
                website_id: siteId2,
                user_id: DEMO_USER_ID,
                role: 'cms_admin',
                invited_by: null,
                joined_at: now,
                created_at: now,
                updated_at: now,
            },
        ]);

        await queryInterface.bulkInsert({ tableName: 'cms_contents', schema: 'cms' }, [
            {
                id: contentId1,
                website_id: siteId1,
                category_id: cat1Id,
                author_id: DEMO_USER_ID,
                last_edited_by: DEMO_USER_ID,
                title: 'Welcome to Baalvion CMS',
                slug: 'welcome-to-baalvion-cms',
                excerpt: 'Introducing the enterprise multi-website CMS platform.',
                featured_image: null,
                content_type: 'post',
                content_blocks: JSON.stringify([
                    { id: 'b1', type: 'heading', order: 0, content: { text: 'Welcome to Baalvion CMS', level: 2 } },
                    { id: 'b2', type: 'paragraph', order: 1, content: { text: 'This is the first post on the Baalvion platform.' } },
                ]),
                tag_ids: JSON.stringify([]),
                seo_metadata: JSON.stringify({ title: 'Welcome to Baalvion CMS', description: 'Introducing the enterprise multi-website CMS.' }),
                status: 'published',
                visibility: 'public',
                published_at: now,
                scheduled_at: null,
                view_count: 0,
                revision_count: 1,
                custom_fields: JSON.stringify({}),
                created_at: now,
                updated_at: now,
            },
        ]);

        await queryInterface.bulkInsert({ tableName: 'cms_workflows', schema: 'cms' }, [
            {
                id: workflowId1,
                content_id: contentId1,
                current_state: 'published',
                submitted_by: DEMO_USER_ID,
                reviewed_by: null,
                approved_by: DEMO_USER_ID,
                published_by: DEMO_USER_ID,
                submitted_at: now,
                reviewed_at: null,
                approved_at: now,
                published_at: now,
                comments: null,
                scheduled_publish_at: null,
                schedule_job_id: null,
                created_at: now,
                updated_at: now,
            },
        ]);
    },

    async down(queryInterface) {
        await queryInterface.bulkDelete({ tableName: 'cms_workflows', schema: 'cms' }, null, {});
        await queryInterface.bulkDelete({ tableName: 'cms_contents', schema: 'cms' }, null, {});
        await queryInterface.bulkDelete({ tableName: 'cms_website_members', schema: 'cms' }, null, {});
        await queryInterface.bulkDelete({ tableName: 'cms_categories', schema: 'cms' }, null, {});
        await queryInterface.bulkDelete({ tableName: 'cms_websites', schema: 'cms' }, null, {});
    },
};
