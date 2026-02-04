import { describe, it, expect, vi } from 'vitest';
import * as renderer from 'react-test-renderer';
import { MasonryGrid, MasonryGridSimple } from './MasonryGrid';

// Mock React Native components
vi.mock('react-native', () => ({
  View: 'View',
  ScrollView: 'ScrollView',
  Text: 'Text',
}));

// Mock the cn utility
vi.mock('../utils/cn', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));

describe('MasonryGrid', () => {
  const testData = [
    { id: '1', name: 'Item 1' },
    { id: '2', name: 'Item 2' },
    { id: '3', name: 'Item 3' },
    { id: '4', name: 'Item 4' },
    { id: '5', name: 'Item 5' },
  ];

  const renderItem = (item: (typeof testData)[0]) => <span>{item.name}</span>;
  const keyExtractor = (item: (typeof testData)[0]) => item.id;

  it('renders all items', () => {
    const tree = renderer
      .create(
        <MasonryGrid
          data={testData}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
        />
      )
      .toJSON();

    const jsonStr = JSON.stringify(tree);
    expect(jsonStr).toContain('Item 1');
    expect(jsonStr).toContain('Item 2');
    expect(jsonStr).toContain('Item 3');
    expect(jsonStr).toContain('Item 4');
    expect(jsonStr).toContain('Item 5');
  });

  it('defaults to 2 columns', () => {
    const tree = renderer.create(
      <MasonryGrid data={testData} renderItem={renderItem} keyExtractor={keyExtractor} />
    );

    // Find all column Views (direct children of ScrollView)
    const scrollView = tree.root.findByType('ScrollView' as never);
    const columns = scrollView.props.children;
    expect(columns.length).toBe(2);
  });

  it('supports custom numColumns', () => {
    const tree = renderer.create(
      <MasonryGrid
        data={testData}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={3}
      />
    );

    const scrollView = tree.root.findByType('ScrollView' as never);
    const columns = scrollView.props.children;
    expect(columns.length).toBe(3);
  });

  it('distributes items across columns in round-robin fashion', () => {
    const tree = renderer.create(
      <MasonryGrid
        data={testData}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={2}
      />
    );

    // With 5 items and 2 columns:
    // Column 0: items 0, 2, 4 (Item 1, Item 3, Item 5)
    // Column 1: items 1, 3 (Item 2, Item 4)
    const scrollView = tree.root.findByType('ScrollView' as never);
    const columns = scrollView.props.children;

    // First column should have 3 items (indices 0, 2, 4)
    expect(columns[0].props.children.length).toBe(3);
    // Second column should have 2 items (indices 1, 3)
    expect(columns[1].props.children.length).toBe(2);
  });

  it('applies gap styling', () => {
    const tree = renderer.create(
      <MasonryGrid
        data={testData}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        gap={20}
      />
    );

    const scrollView = tree.root.findByType('ScrollView' as never);
    expect(scrollView.props.style.paddingHorizontal).toBe(10); // gap / 2
  });

  it('applies default gap of 12', () => {
    const tree = renderer.create(
      <MasonryGrid data={testData} renderItem={renderItem} keyExtractor={keyExtractor} />
    );

    const scrollView = tree.root.findByType('ScrollView' as never);
    expect(scrollView.props.style.paddingHorizontal).toBe(6); // 12 / 2
  });

  it('applies custom className', () => {
    const tree = renderer
      .create(
        <MasonryGrid
          data={testData}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          className="custom-grid"
        />
      )
      .toJSON();

    expect(JSON.stringify(tree)).toContain('custom-grid');
  });

  it('applies contentContainerClassName', () => {
    const tree = renderer.create(
      <MasonryGrid
        data={testData}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerClassName="custom-content"
      />
    );

    const scrollView = tree.root.findByType('ScrollView' as never);
    expect(scrollView.props.contentContainerClassName).toContain('custom-content');
  });

  it('handles empty data array', () => {
    const tree = renderer.create(
      <MasonryGrid data={[]} renderItem={renderItem} keyExtractor={keyExtractor} />
    );

    const scrollView = tree.root.findByType('ScrollView' as never);
    const columns = scrollView.props.children;
    // Should still have 2 empty columns
    expect(columns.length).toBe(2);
    expect(columns[0].props.children.length).toBe(0);
    expect(columns[1].props.children.length).toBe(0);
  });

  it('passes correct index to renderItem', () => {
    const mockRenderItem = vi.fn((item: (typeof testData)[0], index: number) => (
      <span>
        {item.name}-{index}
      </span>
    ));

    renderer.create(
      <MasonryGrid
        data={testData}
        renderItem={mockRenderItem}
        keyExtractor={keyExtractor}
        numColumns={2}
      />
    );

    // Verify renderItem was called with correct original indices
    expect(mockRenderItem).toHaveBeenCalledWith(testData[0], 0);
    expect(mockRenderItem).toHaveBeenCalledWith(testData[1], 1);
    expect(mockRenderItem).toHaveBeenCalledWith(testData[2], 2);
    expect(mockRenderItem).toHaveBeenCalledWith(testData[3], 3);
    expect(mockRenderItem).toHaveBeenCalledWith(testData[4], 4);
  });

  it('uses keyExtractor for item keys', () => {
    const mockKeyExtractor = vi.fn((item: (typeof testData)[0]) => `key-${item.id}`);

    renderer.create(
      <MasonryGrid
        data={testData}
        renderItem={renderItem}
        keyExtractor={mockKeyExtractor}
      />
    );

    expect(mockKeyExtractor).toHaveBeenCalledTimes(5);
  });
});

describe('MasonryGridSimple', () => {
  const testData = [
    { id: '1', name: 'Item 1' },
    { id: '2', name: 'Item 2' },
    { id: '3', name: 'Item 3' },
  ];

  const renderItem = (item: (typeof testData)[0]) => <span>{item.name}</span>;
  const keyExtractor = (item: (typeof testData)[0]) => item.id;

  it('renders all items', () => {
    const tree = renderer
      .create(
        <MasonryGridSimple
          data={testData}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
        />
      )
      .toJSON();

    const jsonStr = JSON.stringify(tree);
    expect(jsonStr).toContain('Item 1');
    expect(jsonStr).toContain('Item 2');
    expect(jsonStr).toContain('Item 3');
  });

  it('applies flex-wrap styling', () => {
    const tree = renderer
      .create(
        <MasonryGridSimple
          data={testData}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
        />
      )
      .toJSON();

    expect(JSON.stringify(tree)).toContain('flex-row');
    expect(JSON.stringify(tree)).toContain('flex-wrap');
  });

  it('renders items at 50% width', () => {
    const tree = renderer.create(
      <MasonryGridSimple
        data={testData}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
      />
    );

    // Find item containers (direct children of the grid)
    const rootView = tree.root.findByType('View' as never);
    const itemContainers = rootView.props.children;

    itemContainers.forEach((container: { props: { style: { width: string } } }) => {
      expect(container.props.style.width).toBe('50%');
    });
  });

  it('applies custom gap', () => {
    const tree = renderer.create(
      <MasonryGridSimple
        data={testData}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        gap={24}
      />
    );

    const rootView = tree.root.findByType('View' as never);
    expect(rootView.props.style.margin).toBe(-12); // -gap / 2
  });

  it('applies custom className', () => {
    const tree = renderer
      .create(
        <MasonryGridSimple
          data={testData}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          className="simple-grid"
        />
      )
      .toJSON();

    expect(JSON.stringify(tree)).toContain('simple-grid');
  });

  it('handles empty data array', () => {
    const tree = renderer.create(
      <MasonryGridSimple data={[]} renderItem={renderItem} keyExtractor={keyExtractor} />
    );

    const rootView = tree.root.findByType('View' as never);
    expect(rootView.props.children.length).toBe(0);
  });
});
