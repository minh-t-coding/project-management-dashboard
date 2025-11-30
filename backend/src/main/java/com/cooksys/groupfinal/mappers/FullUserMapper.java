package com.cooksys.groupfinal.mappers;

import java.util.Set;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import com.cooksys.groupfinal.dtos.FullUserDto;
import com.cooksys.groupfinal.dtos.UserRequestDto;
import com.cooksys.groupfinal.entities.User;

@Mapper(componentModel = "spring", uses = { ProfileMapper.class, CredentialsMapper.class, CompanyMapper.class, TeamMapper.class })
public interface FullUserMapper {
	
	@Mapping(source = "credentials.username", target = "username")
	FullUserDto entityToFullUserDto(User user);

    Set<FullUserDto> entitiesToFullUserDtos(Set<User> users);

    User requestDtoToEntity(UserRequestDto userRequestDto);

}
