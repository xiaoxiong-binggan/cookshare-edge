import React, { useState, useEffect } from 'react'
import { 
  Card, 
  Input, 
  Button, 
  List, 
  Avatar, 
  Tag, 
  Pagination,
  Select,
  Slider,
  Space,
  Typography,
  message
} from 'antd'
import { 
  SearchOutlined, 
  ClockCircleOutlined,
  FireOutlined,
  BookOutlined, // 替换BookmarkOutlined
  LikeOutlined   // 替换ThumbsUpOutlined
} from '@ant-design/icons'
import { recipeService } from '@services/api'
import { useEdgeCache } from '@hooks/useEdge'
import type { Recipe } from '@types'

const { Title, Paragraph } = Typography

const RecipeBrowser: React.FC = () => {
  const [searchText, setSearchText] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [cuisine, setCuisine] = useState('')
  const [maxTime, setMaxTime] = useState(60)
  const [sort, setSort] = useState<'hot' | 'new' | 'trending'>('hot')

  // 边缘缓存获取菜谱
  const { data: recipesData, loading, refresh } = useEdgeCache(
    `recipes-${page}-${limit}-${cuisine}-${maxTime}-${sort}`,
    () => recipeService.getRecipes({
      page,
      limit,
      cuisine,
      maxTime,
      sort
    }).then(res => res.data)
  )
  const recipes = recipesData?.data || []
  const total = recipesData?.total || 0

  // 搜索处理
  const handleSearch = () => {
    setPage(1)
    refresh()
  }

  // 点赞处理
  const handleLike = async (id: string) => {
    try {
      await recipeService.likeRecipe(id)
      message.success('点赞成功')
      refresh()
    } catch (error) {
      message.error('操作失败')
    }
  }

  return (
    <div className="recipe-browser">
      <Title level={3}>
        <SearchOutlined /> 边缘菜谱速查助手
      </Title>
      <Paragraph>
        全球边缘缓存，离线可用的美食菜谱库
      </Paragraph>

      <Card bordered={false} style={{ marginBottom: 24 }}>
        <Space size="large" wrap>
          <Input
            placeholder="搜索菜谱名称"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 200 }}
          />
          <Select
            placeholder="选择菜系"
            value={cuisine}
            onChange={setCuisine}
            style={{ width: 150 }}
            options={[
              { value: '', label: '全部' },
              { value: 'chinese', label: '中餐' },
              { value: 'western', label: '西餐' },
              { value: 'japanese', label: '日料' },
              { value: 'korean', label: '韩料' }
            ]}
          />
          <div style={{ width: 200 }}>
            <Paragraph>最大耗时: {maxTime}分钟</Paragraph>
            <Slider
              value={maxTime}
              min={10}
              max={120}
              onChange={setMaxTime}
            />
          </div>
          <Select
            placeholder="排序方式"
            value={sort}
            onChange={setSort}
            style={{ width: 120 }}
            options={[
              { value: 'hot', label: '热门' },
              { value: 'new', label: '最新' },
              { value: 'trending', label: '趋势' }
            ]}
          />
          <Button
            type="primary"
            onClick={handleSearch}
            icon={<SearchOutlined />}
          >
            搜索
          </Button>
        </Space>
      </Card>

      <List
        loading={loading}
        dataSource={recipes}
        renderItem={(recipe: Recipe) => (
          <List.Item
            key={recipe.id}
            actions={[
              <Button
                icon={<LikeOutlined />} // 已修复图标
                onClick={() => handleLike(recipe.id)}
              >
                {recipe.likes}
              </Button>,
              <Button icon={<BookOutlined />}> // 已修复图标
                {recipe.collects}
              </Button>
            ]}
          >
            <List.Item.Meta
              avatar={<Avatar src={recipe.coverImage} />}
              title={recipe.title}
              description={
                <Space>
                  <Tag>{recipe.difficulty}</Tag>
                  <Tag icon={<ClockCircleOutlined />}>{recipe.prepTime + recipe.cookTime}分钟</Tag>
                  <Tag>{recipe.cuisine}</Tag>
                </Space>
              }
            />
            <div>
              <Paragraph ellipsis={{ rows: 2 }}>{recipe.description}</Paragraph>
              <Button type="link">查看详情</Button>
            </div>
          </List.Item>
        )}
        pagination={{
          current: page,
          pageSize: limit,
          onChange: (p) => setPage(p),
          total
        }}
      />
    </div>
  )
}

export default RecipeBrowser
