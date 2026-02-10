import { describe, it, expect } from 'vitest';
import { projects } from '../../src/data/projects';

describe('Portfolio Data Validation', () => {
  it('should have projects defined', () => {
    expect(projects).toBeDefined();
    expect(projects.length).toBeGreaterThan(0);
  });

  it('all project URLs should be valid HTTPS links', () => {
    projects.forEach(project => {
      expect(project.url).toMatch(/^https:\/\//);
      expect(project.url).not.toContain('localhost');
      expect(project.url).not.toContain('127.0.0.1');
    });
  });

  it('all projects should have required fields', () => {
    projects.forEach(project => {
      // Check for title
      expect(project.title).toBeTruthy();
      expect(project.title.length).toBeGreaterThan(0);

      // Check for description
      expect(project.desc).toBeTruthy();
      expect(project.desc.length).toBeGreaterThan(10);

      // Check for stack
      expect(project.stack).toBeInstanceOf(Array);
      expect(project.stack.length).toBeGreaterThan(0);

      // Check for tag
      expect(project.tag).toBeTruthy();

      // Check for URL
      expect(project.url).toBeTruthy();
    });
  });

  it('stack items should be non-empty strings', () => {
    projects.forEach(project => {
      project.stack.forEach(tech => {
        expect(typeof tech).toBe('string');
        expect(tech.length).toBeGreaterThan(0);
      });
    });
  });

  it('project titles should be unique', () => {
    const titles = projects.map(p => p.title);
    const uniqueTitles = new Set(titles);
    expect(uniqueTitles.size).toBe(titles.length);
  });

  it('project URLs should be unique', () => {
    const urls = projects.map(p => p.url);
    const uniqueUrls = new Set(urls);
    expect(uniqueUrls.size).toBe(urls.length);
  });
});
