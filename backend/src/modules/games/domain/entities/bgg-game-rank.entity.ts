export interface BggGameRank {
  id: string;
  name: string;
  yearpublished: string;
  rank: string;
  bayesaverage: string;
  average: string;
  usersrated: string;
  is_expansion: string;
  abstracts_rank?: string;
  cgs_rank?: string;
  childrensgames_rank?: string;
  familygames_rank?: string;
  partygames_rank?: string;
  strategygames_rank?: string;
  thematic_rank?: string;
  wargames_rank?: string;
}
