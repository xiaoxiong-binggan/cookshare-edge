// 原导入
import { 
  SearchOutlined, 
  ClockCircleOutlined,
  FireOutlined,
  BookmarkOutlined, // 错误：AntD中无此图标
  ThumbsUpOutlined  // 错误：AntD中无此图标
} from '@ant-design/icons'

// 修改后
import { 
  SearchOutlined, 
  ClockCircleOutlined,
  FireOutlined,
  BookOutlined, // 替换BookmarkOutlined
  LikeOutlined  // 替换ThumbsUpOutlined
} from '@ant-design/icons'

// 同时修改对应的Button图标：
actions={[
  <Button
    icon={<LikeOutlined />} // 对应修改
    onClick={() => handleLike(recipe.id)}
  >
    {recipe.likes}
  </Button>,
  <Button icon={<BookOutlined />}> // 对应修改
    {recipe.collects}
  </Button>
]}
