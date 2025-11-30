package com.cooksys.groupfinal.services;

import com.cooksys.groupfinal.dtos.TeamDto;
import com.cooksys.groupfinal.dtos.TeamRequestDto;

public interface TeamService {

	TeamDto createTeam(Long id, TeamRequestDto request);

	TeamDto updateTeam(Long companyId, Long teamId, TeamRequestDto request);

	void deleteTeam(Long companyId, Long teamId);

}
